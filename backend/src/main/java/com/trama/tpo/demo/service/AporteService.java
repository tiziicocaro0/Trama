package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.AporteVersion;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.dto.ResumenProyectoResponse;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AporteService {

    private static final List<TipoAporte> TIPOS_RESUMEN = List.of(
            TipoAporte.INTERES,
            TipoAporte.FORTALEZA,
            TipoAporte.COMUNICACION,
            TipoAporte.SENSORIAL,
            TipoAporte.ESTRATEGIA,
            TipoAporte.DESREGULACION
    );

    private final AporteRepository aporteRepository;
    private final AporteVersionRepository aporteVersionRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final ArchivoRepository archivoRepository;

    @Autowired
    public AporteService(
            AporteRepository aporteRepository,
            AporteVersionRepository aporteVersionRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            ArchivoRepository archivoRepository) {

        this.aporteRepository = aporteRepository;
        this.aporteVersionRepository = aporteVersionRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.archivoRepository = archivoRepository;
    }

    public AporteService(
            AporteRepository aporteRepository,
            AporteVersionRepository aporteVersionRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual) {

        this(
                aporteRepository,
                aporteVersionRepository,
                proyectoRepository,
                usuarioRepository,
                membresiaRepository,
                permisoService,
                usuarioActual,
                null
        );
    }

    // CREAR APORTE
    @Transactional
    public AporteResponse crear(UUID proyectoId, AporteRequest request) {

        permisoService.verificarMiembro(proyectoId);
        permisoService.verificarPuedeEditar(proyectoId);
        validarInteres(request);
        validarFortaleza(request);
        validarObservacion(request);

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
                        : obtenerVisibilidadPorDefecto(request.tipo()))
                .archivado(false)
                .archivos(archivosAdjuntos)
                .build();

        return convertirRespuesta(aporteRepository.saveAndFlush(aporte), true);
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
                obtenerVisibilidadesPermitidas(rol);

        // Filtrar directamente desde la base de datos
        List<Aporte> aportes = aporteRepository.buscarAportesVisibles(
                proyectoId,
                incluirArchivados,
                tipo,
                visibilidadesPermitidas
        );

        // Se calcula una sola vez: si el usuario puede cargar en este proyecto
        boolean puedeCargar = permisoService.puedeEditar(proyectoId);

        if (tipo == TipoAporte.OBSERVACION) {
                ObjectMapper mapper = new ObjectMapper();
                mapper.findAndRegisterModules();

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

        return aportes.stream()
                .map(aporte -> convertirRespuesta(aporte, puedeCargar))
                .toList();
    }

    // RESUMEN "CONOCELO EN 5 MINUTOS" (2.8)
    @Transactional(readOnly = true)
    public ResumenProyectoResponse obtenerResumen(UUID proyectoId) {

        permisoService.verificarMiembro(proyectoId);

        UUID usuarioId = usuarioActual.obtenerId();

        Rol rol = membresiaRepository
                .findRol(usuarioId, proyectoId)
                .orElseThrow(() -> new AccessDeniedException(
                        "No tenés acceso a este proyecto"
                ));

        List<Visibilidad> visibilidadesPermitidas =
                obtenerVisibilidadesPermitidas(rol);

        List<Aporte> aportes = aporteRepository.buscarAportesVigentesPorTiposYVisibilidad(
                proyectoId,
                TIPOS_RESUMEN,
                visibilidadesPermitidas
        );

        boolean puedeCargar = permisoService.puedeEditar(proyectoId);

        List<AporteResponse> convertidos = aportes.stream()
                .map(aporte -> convertirRespuesta(aporte, puedeCargar))
                .toList();

        List<AporteResponse> intereses = filtrarPorTipo(convertidos, TipoAporte.INTERES)
                .stream()
                .sorted(Comparator.comparingInt(this::pesoIntensidadInteres).reversed())
                .toList();

        return new ResumenProyectoResponse(
                intereses,
                filtrarPorTipo(convertidos, TipoAporte.FORTALEZA),
                filtrarPorTipo(convertidos, TipoAporte.COMUNICACION),
                filtrarPorTipo(convertidos, TipoAporte.SENSORIAL),
                filtrarPorTipo(convertidos, TipoAporte.ESTRATEGIA),
                filtrarPorTipo(convertidos, TipoAporte.DESREGULACION)
        );
    }

    private List<AporteResponse> filtrarPorTipo(
            List<AporteResponse> aportes,
            TipoAporte tipo) {

        return aportes.stream()
                .filter(aporte -> aporte.tipo() == tipo)
                .toList();
    }

    private int pesoIntensidadInteres(AporteResponse aporte) {
        if (aporte.datos() == null || aporte.datos().isBlank()) {
            return 0;
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            DatosInteres datos = mapper.readValue(aporte.datos(), DatosInteres.class);
            if (datos.intensidad() == null) {
                return 0;
            }
            return datos.intensidad().ordinal() + 1;
        } catch (JsonProcessingException e) {
            return 0;
        }
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

        return convertirRespuesta(aporteRepository.saveAndFlush(aporte), true);
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
    }

    private List<Archivo> resolverArchivos(UUID proyectoId, List<UUID> archivoIds) {
        if (archivoIds == null || archivoIds.isEmpty()) {
            return new ArrayList<>();
        }

        if (archivoRepository == null) {
            throw new ApiException(
                    "ARCHIVO_INVALIDO",
                    "No se pudo verificar el archivo adjunto",
                    HttpStatus.BAD_REQUEST
            );
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
    private Visibilidad obtenerVisibilidadPorDefecto(TipoAporte tipo) {

        return switch (tipo) {
            case NOTA_PROFESIONAL -> Visibilidad.SOLO_SALUD;
            default -> Visibilidad.TODOS;
        };
    }

    // DETERMINAR VISIBILIDADES PERMITIDAS SEGÚN EL ROL
    private List<Visibilidad> obtenerVisibilidadesPermitidas(Rol rol) {

        return switch (rol) {

            case TUTOR -> List.of(
                    Visibilidad.TODOS,
                    Visibilidad.SOLO_TUTORES,
                    Visibilidad.SOLO_SALUD,
                    Visibilidad.SOLO_EDUCACION
            );

            case SALUD -> List.of(
                    Visibilidad.TODOS,
                    Visibilidad.SOLO_SALUD
            );

            case EDUCACION -> List.of(
                    Visibilidad.TODOS,
                    Visibilidad.SOLO_EDUCACION
            );

            default -> List.of(
                    Visibilidad.TODOS
            );
        };
    }

    // CONVERTIR ENTIDAD A DTO
    private AporteResponse convertirRespuesta(Aporte aporte, boolean puedeCargar) {

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
                archivos
        );
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
                ObjectMapper mapper = new ObjectMapper();

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
                ObjectMapper mapper = new ObjectMapper();

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
                ObjectMapper mapper = new ObjectMapper();
                mapper.findAndRegisterModules();

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
