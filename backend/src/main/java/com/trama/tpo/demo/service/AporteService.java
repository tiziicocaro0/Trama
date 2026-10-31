package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.AporteVersion;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.dto.MiembroResponse.EspecialidadItemResponse;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.observacion.DatosObservacion;
import java.util.ArrayList;
import java.util.Objects;
import java.util.Comparator;
import com.trama.tpo.demo.aporte.interes.DatosInteres;
import com.trama.tpo.demo.aporte.fortaleza.DatosFortaleza;
import com.trama.tpo.demo.aporte.nota.DatosNota;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AporteService {

    private final AporteRepository aporteRepository;
    private final AporteVersionRepository aporteVersionRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final ArchivoRepository archivoRepository;
    private final RegistroAccionService registroAccionService;
    private final ConfirmacionAporteService confirmacionAporteService;
    private final AvisoNotaService avisoNotaService;
    // Lee el JSON "datos" de cada tipo de aporte (fechas incluidas).
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    public AporteService(
            AporteRepository aporteRepository,
            AporteVersionRepository aporteVersionRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            ArchivoRepository archivoRepository,
            RegistroAccionService registroAccionService,
            ConfirmacionAporteService confirmacionAporteService,
            AvisoNotaService avisoNotaService) {

        this.aporteRepository = aporteRepository;
        this.aporteVersionRepository = aporteVersionRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.archivoRepository = archivoRepository;
        this.registroAccionService = registroAccionService;
        this.confirmacionAporteService = confirmacionAporteService;
        this.avisoNotaService = avisoNotaService;
    }

    // CREAR APORTE
    @Transactional
    public AporteResponse crear(UUID proyectoId, AporteRequest request) {

        permisoService.verificarMiembro(proyectoId);
        permisoService.verificarPuedeEditar(proyectoId);
        // 4.2: las notas profesionales solo las cargan educación y salud
        if (request.tipo() == TipoAporte.NOTA_PROFESIONAL) {
            permisoService.verificarPuedeCargarNotas(proyectoId);
        }
        validarInteres(request);
        validarFortaleza(request);
        validarObservacion(request);
        validarNota(request);

        UUID usuarioId = usuarioActual.obtenerId();

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO",
                        "El proyecto no existe",
                        HttpStatus.NOT_FOUND
                ));

        Usuario autor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "El usuario no existe",
                        HttpStatus.NOT_FOUND
                ));

        List<Archivo> archivosAdjuntos = resolverArchivos(proyectoId, request.archivoIds());

        Aporte aporte = Aporte.builder()
                .proyecto(proyecto)
                .autor(autor)
                .tipo(request.tipo())
                .titulo(request.titulo())
                .contenido(request.contenido())
                .datos(request.datos())
                .visibilidad(request.visibilidad() != null
                        ? request.visibilidad()
                        : obtenerVisibilidadPorDefecto(request.tipo(), proyectoId, usuarioId))
                .archivado(false)
                .archivos(archivosAdjuntos)
                .build();

        Aporte guardado = aporteRepository.saveAndFlush(aporte);

        // 0.2: auditoría (la sección es el tipo de aporte, nunca el contenido)
        registroAccionService.registrar(
                usuarioId, proyectoId, AccionRegistro.CREAR, guardado.getTipo().name());

        // 6.1: una nota nueva se avisa a quienes pueden leerla
        avisoNotaService.notaNueva(guardado);

        // Un aporte recién creado todavía no tiene confirmaciones (3.3)
        return convertirRespuesta(guardado, true, especialidadesPorAutor(proyectoId), List.of());
    }

    // LISTAR APORTES
    @Transactional(readOnly = true)
    public List<AporteResponse> listar(
            UUID proyectoId,
            TipoAporte tipo,
            Boolean archivados) {

        permisoService.verificarMiembro(proyectoId);

        UUID usuarioId = usuarioActual.obtenerId();

        Rol rol = membresiaRepository
                .findRol(usuarioId, proyectoId)
                .orElseThrow(() -> new AccessDeniedException(
                        "No tenés acceso a este proyecto"
                ));

        boolean incluirArchivados = Boolean.TRUE.equals(archivados);

        // Determinar qué aportes puede ver el usuario según su rol
        List<Visibilidad> visibilidadesPermitidas =
                PermisoService.visibilidadesPermitidas(rol);

        // Filtrar directamente desde la base de datos
        List<Aporte> aportes = aporteRepository.buscarAportesVisibles(
                proyectoId,
                incluirArchivados,
                tipo,
                visibilidadesPermitidas
        );

        // Se calcula una sola vez: si el usuario puede cargar en este proyecto
        boolean puedeCargar = permisoService.puedeEditar(proyectoId);
        Map<UUID, List<EspecialidadItemResponse>> especialidades =
                especialidadesPorAutor(proyectoId);

        if (tipo == TipoAporte.OBSERVACION) {
                aportes.sort(
                        Comparator.comparing(
                                (Aporte aporte) -> {
                                        try {
                                        DatosObservacion datos = mapper.readValue(
                                                aporte.getDatos(),
                                                DatosObservacion.class
                                        );

                                        return datos.fecha().toInstant();

                                        } catch (JsonProcessingException e) {
                                        throw new ApiException(
                                                "DATOS_OBSERVACION_INVALIDOS",
                                                "No se pudo leer la fecha de la observación",
                                                HttpStatus.INTERNAL_SERVER_ERROR
                                        );
                                        }
                                }
                        ).reversed()
                );
        }

        // 3.3: las confirmaciones de todos los aportes del listado, en una sola búsqueda
        Map<UUID, List<ConfirmacionAporteService.Confirmante>> confirmantes =
                confirmacionAporteService.confirmantesPorAporte(aportes.stream().map(Aporte::getId).toList());

        return aportes.stream()
                .map(aporte -> convertirRespuesta(aporte, puedeCargar, especialidades,
                        confirmantes.getOrDefault(aporte.getId(), List.of())))
                .toList();
    }

    // EDITAR APORTE
    @Transactional
    public AporteResponse editar(
            UUID proyectoId,
            UUID aporteId,
            AporteRequest request) {

        Aporte aporte = obtenerParaEditar(proyectoId, aporteId);

        if (Boolean.TRUE.equals(aporte.getArchivado())) {
            throw new ApiException(
                    "APORTE_ARCHIVADO",
                    "No se puede editar un aporte archivado",
                    HttpStatus.CONFLICT
            );
        }
        // No permitir cambiar el tipo de aporte
        if (aporte.getTipo() != request.tipo()) {
            throw new ApiException(
                    "TIPO_APORTE_INVALIDO",
                    "No se puede cambiar el tipo de un aporte",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Validar los datos específicos del aporte
        validarInteres(request);
        validarFortaleza(request);
        validarObservacion(request);
        validarNota(request);

        // Guardar la versión anterior antes de editar
        AporteVersion version = AporteVersion.builder()
                .aporte(aporte)
                .autor(aporte.getAutor())
                .titulo(aporte.getTitulo())
                .contenido(aporte.getContenido())
                .datos(aporte.getDatos())
                .build();

        aporteVersionRepository.save(version);

        // Actualizar el aporte
        aporte.setTipo(request.tipo());
        aporte.setTitulo(request.titulo());
        aporte.setContenido(request.contenido());
        aporte.setDatos(request.datos());

        if (request.visibilidad() != null) {
            aporte.setVisibilidad(request.visibilidad());
        }

        if (request.archivoIds() != null) {
            aporte.setArchivos(resolverArchivos(proyectoId, request.archivoIds()));
        }

        Aporte guardado = aporteRepository.saveAndFlush(aporte);

        // 0.2: auditoría
        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.EDITAR, guardado.getTipo().name());

        // Editar no borra las confirmaciones: se devuelven las que ya tenía (3.3)
        return convertirRespuesta(guardado, true, especialidadesPorAutor(proyectoId),
                confirmacionAporteService.confirmantesPorAporte(List.of(guardado.getId()))
                        .getOrDefault(guardado.getId(), List.of()));
    }

    // OBTENER APORTE PARA EDITAR
    @Transactional(readOnly = true)
    public Aporte obtenerParaEditar(UUID proyectoId, UUID aporteId) {

        permisoService.verificarMiembro(proyectoId);
        permisoService.verificarPuedeEditar(proyectoId);

        Aporte aporte = aporteRepository
                .findByIdAndProyectoId(aporteId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "APORTE_NO_ENCONTRADO",
                        "El aporte no existe",
                        HttpStatus.NOT_FOUND
                ));

        // Solamente el autor puede editar o archivar
        permisoService.verificarAutor(aporte.getAutor().getId());

        // Verificar que también tenga permiso para ver el aporte
        permisoService.verificarPuedeVerAporte(
                proyectoId,
                aporte.getVisibilidad()
        );

        return aporte;
    }

    // ARCHIVAR APORTE
    @Transactional
    public void archivar(UUID proyectoId, UUID aporteId) {

        Aporte aporte = obtenerParaEditar(proyectoId, aporteId);

        aporte.setArchivado(true);

        aporteRepository.save(aporte);

        // 0.2: auditoría
        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.ARCHIVAR, aporte.getTipo().name());
    }

    private List<Archivo> resolverArchivos(UUID proyectoId, List<UUID> archivoIds) {
        if (archivoIds == null || archivoIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Archivo> archivos = new ArrayList<>();
        for (UUID archivoId : archivoIds) {
            if (archivoId == null) {
                throw new ApiException(
                        "ARCHIVO_INVALIDO",
                        "El identificador del archivo no es válido",
                        HttpStatus.BAD_REQUEST
                );
            }
            Archivo archivo = archivoRepository
                    .findByIdAndProyectoId(archivoId, proyectoId)
                    .orElseThrow(() -> new ApiException(
                            "ARCHIVO_INVALIDO",
                            "El archivo adjunto no pertenece a este proyecto o no existe",
                            HttpStatus.BAD_REQUEST
                    ));
            archivos.add(archivo);
        }
        return archivos;
    }

    // VISIBILIDAD PREDETERMINADA SEGÚN EL TIPO
    // Una nota queda visible para el área de quien la escribe (y los tutores, que ven todo).
    private Visibilidad obtenerVisibilidadPorDefecto(
            TipoAporte tipo,
            UUID proyectoId,
            UUID autorId) {

        if (tipo != TipoAporte.NOTA_PROFESIONAL) {
            return Visibilidad.TODOS;
        }

        return membresiaRepository.findRol(autorId, proyectoId)
                .filter(rol -> rol == Rol.EDUCACION)
                .map(rol -> Visibilidad.SOLO_EDUCACION)
                .orElse(Visibilidad.SOLO_SALUD);
    }

    // 4.2: especialidades de cada miembro del proyecto, para mostrarlas junto al autor
    private Map<UUID, List<EspecialidadItemResponse>> especialidadesPorAutor(UUID proyectoId) {

        return membresiaRepository.findByProyectoId(proyectoId).stream()
                .filter(m -> m.getUsuario() != null)
                .collect(Collectors.toMap(
                        m -> m.getUsuario().getId(),
                        MiembroResponse::especialidadesDe,
                        (primera, segunda) -> primera));
    }


    // CONVERTIR ENTIDAD A DTO
    private AporteResponse convertirRespuesta(
            Aporte aporte,
            boolean puedeCargar,
            Map<UUID, List<EspecialidadItemResponse>> especialidades,
            List<ConfirmacionAporteService.Confirmante> confirmantes) {

        boolean esAutor = aporte.getAutor().getId()
                .equals(usuarioActual.obtenerId());

        List<Archivo> listaArchivos = aporte.getArchivos() != null
                ? aporte.getArchivos()
                : List.of();

        List<UUID> archivoIds = listaArchivos.stream()
                .map(Archivo::getId)
                .toList();

        List<ArchivoResponse> archivos = listaArchivos.stream()
                .map(ArchivoResponse::from)
                .toList();

        return new AporteResponse(
                aporte.getId(),
                aporte.getProyecto().getId(),
                aporte.getAutor().getId(),
                nombreCompleto(aporte.getAutor()),
                aporte.getTipo(),
                aporte.getTitulo(),
                aporte.getContenido(),
                aporte.getDatos(),
                aporte.getVisibilidad(),
                aporte.getArchivado(),
                aporte.getCreadoEn(),
                aporte.getActualizadoEn(),
                puedeCargar && esAutor,
                archivoIds,
                archivos,
                especialidades.getOrDefault(aporte.getAutor().getId(), List.of()),
                confirmantes.size(),
                confirmantes.stream().anyMatch(c -> c.usuarioId().equals(usuarioActual.obtenerId())),
                confirmantes.stream().map(ConfirmacionAporteService.Confirmante::nombre).toList()
        );
    }

    private static String nombreCompleto(Usuario usuario) {
        return (usuario.getNombre() + " " + usuario.getApellido()).trim();
    }

    // 4.2: una nota profesional necesita su tipo y su fecha dentro de "datos"
    private void validarNota(AporteRequest request) {

        if (request.tipo() != TipoAporte.NOTA_PROFESIONAL) {
            return;
        }

        try {
            DatosNota datos = request.datos() == null || request.datos().isBlank()
                    ? null
                    : mapper.readValue(request.datos(), DatosNota.class);

            if (datos == null || datos.tipoNota() == null || datos.fecha() == null) {
                throw new ApiException(
                        "DATOS_NOTA_INVALIDOS",
                        "El tipo de nota y la fecha son obligatorios",
                        HttpStatus.BAD_REQUEST
                );
            }

        } catch (JsonProcessingException e) {
            throw new ApiException(
                    "DATOS_NOTA_INVALIDOS",
                    "Los datos de la nota no son válidos",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private void validarInteres(AporteRequest request) {

        if (request.tipo() != TipoAporte.INTERES) {
                return;
        }

        if (request.datos() == null || request.datos().isBlank()) {
                throw new ApiException(
                        "DATOS_INTERES_INVALIDOS",
                        "La categoría y la intensidad son obligatorias",
                        HttpStatus.BAD_REQUEST
                );
        }

        try {
                DatosInteres datos = mapper.readValue(
                        request.datos(),
                        DatosInteres.class
                );

                if (datos.categoria() == null ||
                        datos.intensidad() == null) {

                throw new ApiException(
                        "DATOS_INTERES_INVALIDOS",
                        "La categoría y la intensidad son obligatorias",
                        HttpStatus.BAD_REQUEST
                );
                }

        } catch (JsonProcessingException e) {

                throw new ApiException(
                        "DATOS_INTERES_INVALIDOS",
                        "Los datos del interés no son válidos",
                        HttpStatus.BAD_REQUEST
                );
        }
    }

    private void validarFortaleza(AporteRequest request) {

        if (request.tipo() != TipoAporte.FORTALEZA) {
                return;
        }

        if (request.titulo() == null ||
                request.titulo().isBlank()) {

                throw new ApiException(
                        "FORTALEZA_INVALIDA",
                        "La descripción de la fortaleza es obligatoria",
                        HttpStatus.BAD_REQUEST
                );
        }

        if (request.datos() == null ||
                request.datos().isBlank()) {

                throw new ApiException(
                        "DATOS_FORTALEZA_INVALIDOS",
                        "El contexto de la fortaleza es obligatorio",
                        HttpStatus.BAD_REQUEST
                );
        }

        try {
                DatosFortaleza datos = mapper.readValue(
                        request.datos(),
                        DatosFortaleza.class
                );

                if (datos.contexto() == null) {
                throw new ApiException(
                        "DATOS_FORTALEZA_INVALIDOS",
                        "El contexto de la fortaleza es obligatorio",
                        HttpStatus.BAD_REQUEST
                );
                }

                // 2.2: el ejemplo es opcional y corto: un caso concreto, no un informe.
                if (datos.ejemplo() != null && datos.ejemplo().length() > 500) {
                throw new ApiException(
                        "EJEMPLO_MUY_LARGO",
                        "El ejemplo de la fortaleza puede tener hasta 500 caracteres",
                        HttpStatus.BAD_REQUEST
                );
                }

        } catch (JsonProcessingException e) {

                throw new ApiException(
                        "DATOS_FORTALEZA_INVALIDOS",
                        "Los datos de la fortaleza no son válidos",
                        HttpStatus.BAD_REQUEST
                );
        }
    }

    private void validarObservacion(AporteRequest request) {

        if (request.tipo() != TipoAporte.OBSERVACION) {
                return;
        }

        if (request.contenido() == null ||
                request.contenido().isBlank()) {
                throw new ApiException(
                        "OBSERVACION_INVALIDA",
                        "El texto de la observación es obligatorio",
                        HttpStatus.BAD_REQUEST
                );
        }

        if (request.datos() == null ||
                request.datos().isBlank()) {
                throw new ApiException(
                        "DATOS_OBSERVACION_INVALIDOS",
                        "La fecha, el contexto y las etiquetas son obligatorios",
                        HttpStatus.BAD_REQUEST
                );
        }

        try {
                DatosObservacion datos = mapper.readValue(
                        request.datos(),
                        DatosObservacion.class
                );

                if (datos.fecha() == null ||
                        datos.contexto() == null ||
                        datos.etiquetas() == null ||
                        datos.etiquetas().isEmpty() ||
                        datos.etiquetas().stream().anyMatch(Objects::isNull)) {

                throw new ApiException(
                        "DATOS_OBSERVACION_INVALIDOS",
                        "La fecha, el contexto y al menos una etiqueta son obligatorios",
                        HttpStatus.BAD_REQUEST
                );
                }

        } catch (JsonProcessingException e) {
                throw new ApiException(
                        "DATOS_OBSERVACION_INVALIDOS",
                        "Los datos de la observación no son válidos",
                        HttpStatus.BAD_REQUEST
                );
        }
    }
}
