package com.trama.tpo.demo.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.repository.MembresiaRepository;

/**
 * 6.1: avisa a la red cuando alguien escribe una nota profesional (4.2).
 * Solo a quienes pueden leerla: la misma regla de visibilidad del listado, y a un familiar
 * solo si la nota es para todos y el tutor le habilitó ver notas (1.8). Nunca al autor.
 * El texto no lleva el contenido de la nota ni el nombre del niño: también puede salir por mail.
 */
@Service
public class AvisoNotaService {

    private final MembresiaRepository membresiaRepository;
    private final NotificacionService notificacionService;

    public AvisoNotaService(
            MembresiaRepository membresiaRepository,
            NotificacionService notificacionService) {

        this.membresiaRepository = membresiaRepository;
        this.notificacionService = notificacionService;
    }

    public void notaNueva(Aporte nota) {

        if (nota.getTipo() != TipoAporte.NOTA_PROFESIONAL) {
            return;
        }

        UUID proyectoId = nota.getProyecto().getId();
        UUID autorId = nota.getAutor().getId();
        Visibilidad visibilidad = nota.getVisibilidad();
        boolean familiarVeNotas = Boolean.TRUE.equals(nota.getProyecto().getFamiliarVeNotas());

        List<UUID> destinatarios = membresiaRepository.findByProyectoId(proyectoId).stream()
                .filter(membresia -> !membresia.getUsuario().getId().equals(autorId))
                .filter(membresia -> puedeLeer(membresia, visibilidad, familiarVeNotas))
                .map(membresia -> membresia.getUsuario().getId())
                .toList();

        String autor = (nota.getAutor().getNombre() + " " + nota.getAutor().getApellido()).trim();

        notificacionService.notificar(
                destinatarios,
                proyectoId,
                TipoNotificacion.NOTA_NUEVA.name(),
                autor + " escribió una nota nueva.",
                "/proyectos/" + proyectoId + "/notas");
    }

    private static boolean puedeLeer(Membresia membresia, Visibilidad visibilidad, boolean familiarVeNotas) {
        if (membresia.getRol() == Rol.FAMILIAR) {
            return familiarVeNotas && visibilidad == Visibilidad.TODOS;
        }
        return PermisoService.visibilidadesPermitidas(membresia.getRol()).contains(visibilidad);
    }
}
