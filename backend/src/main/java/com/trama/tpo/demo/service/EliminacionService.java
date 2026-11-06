package com.trama.tpo.demo.service;

import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class EliminacionService {

    private final ProyectoRepository proyectoRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final NotificacionService notificacionService;
    private final UsuarioActual usuarioActual;

    public EliminacionService(
            ProyectoRepository proyectoRepository,
            MembresiaRepository membresiaRepository,
            UsuarioRepository usuarioRepository,
            PermisoService permisoService,
            NotificacionService notificacionService,
            UsuarioActual usuarioActual) {

        this.proyectoRepository = proyectoRepository;
        this.membresiaRepository = membresiaRepository;
        this.usuarioRepository = usuarioRepository;
        this.permisoService = permisoService;
        this.notificacionService = notificacionService;
        this.usuarioActual = usuarioActual;
    }

    @Transactional
    public Instant solicitarEliminacion(
            UUID proyectoId,
            String nombreConfirmacion) {

        permisoService.verificarAdmin(proyectoId);

        Proyecto proyecto = obtenerProyecto(proyectoId);

        if (nombreConfirmacion == null
                || !proyecto.getNombre().equals(
                        nombreConfirmacion.trim())) {

            throw new ApiException(
                    "NOMBRE_INCORRECTO",
                    "El nombre ingresado no coincide con el del niño",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (proyecto.getEliminacionProgramada() != null) {
            throw new ApiException(
                    "ELIMINACION_YA_PROGRAMADA",
                    "Este perfil ya tiene una eliminación programada",
                    HttpStatus.CONFLICT
            );
        }

        Instant fechaEliminacion = Instant.now()
                .plus(7, ChronoUnit.DAYS);

        UUID usuarioId = usuarioActual.obtenerId();

        Usuario solicitante = usuarioRepository
                .findById(usuarioId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "Usuario no encontrado",
                        HttpStatus.NOT_FOUND
                ));

        proyecto.setEliminacionProgramada(fechaEliminacion);
        proyecto.setEliminacionPedidaPor(solicitante);

        proyectoRepository.save(proyecto);

        notificarRed(
                proyecto,
                "ELIMINACION",
                "Se solicitó eliminar el perfil de "
                        + proyecto.getNombre()
                        + ". La eliminación está programada para dentro de 7 días."
        );

        return fechaEliminacion;
    }

    @Transactional
    public void cancelarEliminacion(UUID proyectoId) {

        permisoService.verificarAdmin(proyectoId);

        Proyecto proyecto = obtenerProyecto(proyectoId);

        if (proyecto.getEliminacionProgramada() == null) {
            throw new ApiException(
                    "ELIMINACION_NO_PROGRAMADA",
                    "Este perfil no tiene una eliminación programada",
                    HttpStatus.CONFLICT
            );
        }

        proyecto.setEliminacionProgramada(null);
        proyecto.setEliminacionPedidaPor(null);

        proyectoRepository.save(proyecto);

        notificarRed(
                proyecto,
                "ELIMINACION",
                "Se canceló la eliminación del perfil de "
                        + proyecto.getNombre() + "."
        );
    }

    private Proyecto obtenerProyecto(UUID proyectoId) {
        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO",
                        "Proyecto no encontrado",
                        HttpStatus.NOT_FOUND
                ));
    }

    private void notificarRed(
            Proyecto proyecto,
            String tipo,
            String mensaje) {

        List<UUID> destinatarios = membresiaRepository
                .findByProyectoId(proyecto.getId())
                .stream()
                .map(Membresia::getUsuario)
                .map(Usuario::getId)
                .distinct()
                .toList();

        notificacionService.notificar(
                destinatarios,
                proyecto.getId(),
                tipo,
                mensaje,
                "/proyectos/" + proyecto.getId()
        );
    }
}