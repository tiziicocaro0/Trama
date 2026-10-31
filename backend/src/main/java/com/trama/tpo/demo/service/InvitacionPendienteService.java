package com.trama.tpo.demo.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.InvitacionResponse;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.InvitacionRepository;

/**
 * 1.3: las invitaciones pendientes de un proyecto. El tutor administrador las ve en la Red
 * con su vencimiento y puede cancelarlas. Crear y aceptar siguen en InvitacionService.
 */
@Service
public class InvitacionPendienteService {

    private final InvitacionRepository invitacionRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public InvitacionPendienteService(
            InvitacionRepository invitacionRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {

        this.invitacionRepository = invitacionRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
    }

    // Las vencidas no aparecen: ya no se pueden aceptar (la 1.4 responde 410).
    @Transactional(readOnly = true)
    public List<InvitacionResponse> listarPendientes(UUID proyectoId) {

        permisoService.verificarAdmin(proyectoId);

        return invitacionRepository
                .findByProyectoIdAndEstadoAndVenceEnAfterOrderByVenceEnAsc(
                        proyectoId, EstadoInvitacion.PENDIENTE, Instant.now())
                .stream()
                .map(InvitacionResponse::from)
                .toList();
    }

    // Cancelar no borra la invitacion: queda CANCELADA y el link deja de servir.
    @Transactional
    public void cancelar(UUID proyectoId, UUID invitacionId) {

        permisoService.verificarAdmin(proyectoId);

        Invitacion invitacion = invitacionRepository
                .findByIdAndProyectoId(invitacionId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "INVITACION_NO_ENCONTRADA",
                        "No encontramos esta invitación",
                        HttpStatus.NOT_FOUND));

        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE) {
            throw new ApiException(
                    "INVITACION_NO_PENDIENTE",
                    "La invitación ya fue aceptada o cancelada",
                    HttpStatus.CONFLICT);
        }

        invitacion.setEstado(EstadoInvitacion.CANCELADA);
        invitacionRepository.save(invitacion);

        // 0.2: auditoría (sin el email del invitado: es dato personal)
        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.REVOCAR, "MIEMBROS");
    }
}
