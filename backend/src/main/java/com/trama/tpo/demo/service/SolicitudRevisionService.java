package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.EstadoRevision;
import com.trama.tpo.demo.aporte.SolicitudRevision;
import com.trama.tpo.demo.entity.dto.SolicitudRevisionRequest;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.SolicitudRevisionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Service
public class SolicitudRevisionService {

    private final SolicitudRevisionRepository revisionRepository;
    private final AporteRepository aporteRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioActual usuarioActual;
    private final PermisoService permisoService;
    private final NotificacionService notificacionService;

    public SolicitudRevisionService(
            SolicitudRevisionRepository revisionRepository,
            AporteRepository aporteRepository,
            UsuarioRepository usuarioRepository,
            UsuarioActual usuarioActual,
            PermisoService permisoService,
            NotificacionService notificacionService) {

        this.revisionRepository = revisionRepository;
        this.aporteRepository = aporteRepository;
        this.usuarioRepository = usuarioRepository;
        this.usuarioActual = usuarioActual;
        this.permisoService = permisoService;
        this.notificacionService = notificacionService;
    }

    @Transactional
    public SolicitudRevision solicitarRevision(
            UUID proyectoId,
            UUID aporteId,
            SolicitudRevisionRequest request) {

        // Solo los tutores pueden solicitar revisiones.
        permisoService.verificarTutor(proyectoId);

        Aporte aporte = aporteRepository
                .findByIdAndProyectoId(aporteId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "APORTE_NO_ENCONTRADO",
                        "El aporte no existe en este proyecto",
                        HttpStatus.NOT_FOUND
                ));

        UUID solicitanteId = usuarioActual.obtenerId();

        // No se puede solicitar revisar un aporte propio.
        if (aporte.getAutor().getId().equals(solicitanteId)) {
            throw new ApiException(
                    "REVISION_PROPIA",
                    "No podés solicitar revisar tu propio aporte",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Evitar solicitudes pendientes duplicadas.
        if (revisionRepository.existsByAporteIdAndEstado(
                aporteId, EstadoRevision.PENDIENTE)) {

            throw new ApiException(
                    "REVISION_PENDIENTE",
                    "Este aporte ya tiene una revisión pendiente",
                    HttpStatus.CONFLICT
            );
        }

        String motivo = request.motivo().trim();

        if (motivo.isBlank() || motivo.length() > 1000) {
            throw new ApiException(
                    "MOTIVO_INVALIDO",
                    "El motivo debe tener entre 1 y 1000 caracteres",
                    HttpStatus.BAD_REQUEST
            );
        }

        // AES-GCM agrega 28 bytes: IV (12) + tag (16).
        if (motivo.getBytes(StandardCharsets.UTF_8).length + 28 > 4096) {
            throw new ApiException(
                    "MOTIVO_DEMASIADO_LARGO",
                    "El motivo supera el espacio permitido",
                    HttpStatus.BAD_REQUEST
            );
        }

        Usuario solicitante = usuarioRepository.findById(solicitanteId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "Usuario no encontrado",
                        HttpStatus.NOT_FOUND
                ));

        SolicitudRevision revision = SolicitudRevision.builder()
                .aporte(aporte)
                .solicitante(solicitante)
                .motivo(motivo)
                .estado(EstadoRevision.PENDIENTE)
                .build();

        revision = revisionRepository.save(revision);

        // Notificar al autor original del aporte.
        notificacionService.notificar(
                List.of(aporte.getAutor().getId()),
                proyectoId,
                "REVISION_APORTE",
                "Solicitaron revisar tu aporte: " + aporte.getTitulo(),
                "/proyectos/" + proyectoId + "/aportes/" + aporteId
        );

        return revision;
    }

        @Transactional(readOnly = true)
        public SolicitudRevision obtenerRevision(
                UUID proyectoId,
                UUID revisionId) {

        // Verificar que el usuario pertenece al proyecto.
        permisoService.verificarMiembro(proyectoId);

        // Buscar la revisión dentro del proyecto solicitado.
        SolicitudRevision revision = revisionRepository
                .findByIdAndAporteProyectoId(revisionId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "REVISION_NO_ENCONTRADA",
                        "La solicitud de revisión no existe",
                        HttpStatus.NOT_FOUND
                ));

        // Solo el autor del aporte puede consultar el motivo.
        permisoService.verificarAutor(
                revision.getAporte().getAutor().getId()
        );

        return revision;
        }

    @Transactional
    public SolicitudRevision marcarComoRevisada(
            UUID proyectoId,
            UUID revisionId) {

        permisoService.verificarMiembro(proyectoId);

        SolicitudRevision revision = revisionRepository
                .findByIdAndAporteProyectoId(revisionId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "REVISION_NO_ENCONTRADA",
                        "La solicitud de revisión no existe",
                        HttpStatus.NOT_FOUND
                ));

        // Solo el autor original puede cerrar la revisión.
        permisoService.verificarAutor(
                revision.getAporte().getAutor().getId()
        );

        if (revision.getEstado() == EstadoRevision.REVISADA) {
            throw new ApiException(
                    "REVISION_YA_REVISADA",
                    "La solicitud ya fue marcada como revisada",
                    HttpStatus.CONFLICT
            );
        }

        revision.setEstado(EstadoRevision.REVISADA);

        return revisionRepository.save(revision);
    }
}