package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.AporteVersion;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

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

    public AporteService(
            AporteRepository aporteRepository,
            AporteVersionRepository aporteVersionRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual) {

        this.aporteRepository = aporteRepository;
        this.aporteVersionRepository = aporteVersionRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
    }

    // CREAR APORTE
    @Transactional
    public AporteResponse crear(UUID proyectoId, AporteRequest request) {

        permisoService.verificarMiembro(proyectoId);
        permisoService.verificarPuedeEditar(proyectoId);

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

        Aporte aporte = Aporte.builder()
                .proyecto(proyecto)
                .autor(autor)
                .tipo(request.tipo())
                .titulo(request.titulo())
                .contenido(request.contenido())
                .datos(request.datos())
                .visibilidad(request.visibilidad() == null
                        ? Visibilidad.TODOS
                        : request.visibilidad())
                .archivado(false)
                .build();

        return convertirRespuesta(aporteRepository.saveAndFlush(aporte));
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

        return aportes.stream()
                .map(this::convertirRespuesta)
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

        aporte.setVisibilidad(request.visibilidad() == null
                ? Visibilidad.TODOS
                : request.visibilidad());

        return convertirRespuesta(aporteRepository.saveAndFlush(aporte));
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

        return aporte;
    }

    // ARCHIVAR APORTE
    @Transactional
    public void archivar(UUID proyectoId, UUID aporteId) {

        Aporte aporte = obtenerParaEditar(proyectoId, aporteId);

        aporte.setArchivado(true);

        aporteRepository.save(aporte);
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
    private AporteResponse convertirRespuesta(Aporte aporte) {

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
                aporte.getActualizadoEn()
        );
    }
}