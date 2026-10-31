package com.trama.tpo.demo.service;

import com.trama.tpo.demo.entity.notificacion.Notificacion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.NotificacionRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.exceptions.ApiException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioActual usuarioActual;

    public NotificacionService(
            NotificacionRepository notificacionRepository,
            UsuarioRepository usuarioRepository,
            ProyectoRepository proyectoRepository,
            UsuarioActual usuarioActual) {

        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioActual = usuarioActual;
    }

    // Permite notificar sin asociar un proyecto.
    @Transactional
    public void notificar(
            List<UUID> usuarios,
            String tipo,
            String texto,
            String link) {

        notificar(usuarios, null, tipo, texto, link);
    }

    // Generar una notificacion por cada usuario destinatario.
    @Transactional
    public void notificar(
            List<UUID> usuarios,
            UUID proyectoId,
            String tipo,
            String texto,
            String link) {

        if (usuarios == null || usuarios.isEmpty()) {
            return;
        }

        validarContenido(tipo, texto, link);

        Proyecto proyecto = null;

        if (proyectoId != null) {
            proyecto = proyectoRepository.findById(proyectoId)
                    .orElseThrow(() -> new ApiException("PROYECTO_NO_ENCONTRADO", "Proyecto no encontrado", HttpStatus.NOT_FOUND));
        }

        List<UUID> ids = usuarios.stream()
                .distinct()
                .toList();

        List<Usuario> destinatarios = usuarioRepository.findAllById(ids);

        if (destinatarios.size() != ids.size()) {
            throw new ApiException("DESTINATARIO_NO_ENCONTRADO", "Uno o mas destinatarios no existen", HttpStatus.BAD_REQUEST);
        }

        List<Notificacion> notificaciones = new ArrayList<>();

        for (Usuario usuario : destinatarios) {
            Notificacion notificacion = Notificacion.builder()
                    .usuario(usuario)
                    .proyecto(proyecto)
                    .tipo(tipo)
                    .texto(texto)
                    .link(link)
                    .leida(false)
                    .build();

            notificaciones.add(notificacion);
        }

        notificacionRepository.saveAll(notificaciones);
    }

    // Ultimas 10 notificaciones del usuario autenticado.
    @Transactional(readOnly = true)
    public List<Notificacion> listar() {
        UUID usuarioId = usuarioActual.obtenerId();

        return notificacionRepository.findByUsuarioIdOrderByFechaDesc(
                usuarioId,
                PageRequest.of(0, 10));
    }

    // Cantidad de notificaciones sin leer.
    @Transactional(readOnly = true)
    public long contarNoLeidas() {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(
                usuarioActual.obtenerId());
    }

    // Marcar una notificacion propia como leida.
    @Transactional
    public void marcarComoLeida(UUID notificacionId) {
        UUID usuarioId = usuarioActual.obtenerId();

        Notificacion notificacion = notificacionRepository
                .findByIdAndUsuarioId(notificacionId, usuarioId)
                .orElseThrow(() -> new ApiException("NOTIFICACION_NO_ENCONTRADA", "Notificacion no encontrada", HttpStatus.NOT_FOUND));

        notificacion.setLeida(true);
        notificacionRepository.save(notificacion);
    }

    // Marcar todas las notificaciones propias como leidas.
    @Transactional
    public int marcarTodasComoLeidas() {
        return notificacionRepository.marcarTodasComoLeidas(
                usuarioActual.obtenerId());
    }

    private void validarContenido(
            String tipo,
            String texto,
            String link) {

        if (tipo == null || tipo.isBlank() || tipo.length() > 20) {
            throw new ApiException("NOTIFICACION_INVALIDA", "Tipo de notificacion invalido", HttpStatus.BAD_REQUEST);
        }

        if (texto == null || texto.isBlank() || texto.length() > 255) {
            throw new ApiException("NOTIFICACION_INVALIDA", "Texto de notificacion invalido", HttpStatus.BAD_REQUEST);
        }

        if (link == null || link.isBlank()
                || link.length() > 255
                || !link.startsWith("/")
                || link.startsWith("//")) {
            throw new ApiException("NOTIFICACION_INVALIDA", "Link de notificacion invalido", HttpStatus.BAD_REQUEST);
        }
    }
}