package com.trama.tpo.demo.service;

import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.EventoRequest;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.EventoRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ArchivoRepository archivoRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;

    public EventoService(
            EventoRepository eventoRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            ArchivoRepository archivoRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual) {

        this.eventoRepository = eventoRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.archivoRepository = archivoRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
    }

    // CREAR EVENTO ÚNICO
    @Transactional
    public EventoResponse crear(UUID proyectoId, EventoRequest request) {

        permisoService.verificarMiembro(proyectoId);
        validar(request);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Proyecto no encontrado"));

        Usuario autor = usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        Evento evento = Evento.builder()
                .proyecto(proyecto)
                .autor(autor)
                .titulo(request.titulo().trim())
                .descripcion(request.descripcion())
                .fecha(request.fecha())
                .horaInicio(request.horaInicio())
                .horaFin(request.horaFin())
                .imagen(obtenerImagen(request.imagenId(), proyectoId))
                .tipo("COMUN")
                .recurrente(false)
                .esCambio(false)
                .build();

        return convertir(eventoRepository.saveAndFlush(evento));
    }

    // LISTAR EVENTOS ENTRE DOS FECHAS
    @Transactional(readOnly = true)
    public List<EventoResponse> listar(
            UUID proyectoId, LocalDate desde, LocalDate hasta) {

        permisoService.verificarMiembro(proyectoId);

        if (desde == null || hasta == null || hasta.isBefore(desde)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Rango de fechas inválido");
        }

        return eventoRepository
                .findByProyectoIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
                        proyectoId, desde, hasta)
                .stream()
                .filter(evento -> !Boolean.TRUE.equals(evento.getRecurrente()))
                .map(this::convertir)
                .toList();
    }

    // EDITAR EVENTO
    @Transactional
    public EventoResponse editar(
            UUID proyectoId, UUID eventoId, EventoRequest request) {

        permisoService.verificarMiembro(proyectoId);

        Evento evento = buscarEvento(proyectoId, eventoId);

        permisoService.verificarPuedeModificarEvento(
                proyectoId, evento.getAutor().getId());

        validar(request);

        evento.setTitulo(request.titulo().trim());
        evento.setDescripcion(request.descripcion());
        evento.setFecha(request.fecha());
        evento.setHoraInicio(request.horaInicio());
        evento.setHoraFin(request.horaFin());
        evento.setImagen(obtenerImagen(request.imagenId(), proyectoId));

        return convertir(eventoRepository.saveAndFlush(evento));
    }

    // ELIMINAR EVENTO
    @Transactional
    public void eliminar(UUID proyectoId, UUID eventoId) {

        permisoService.verificarMiembro(proyectoId);

        Evento evento = buscarEvento(proyectoId, eventoId);

        permisoService.verificarPuedeModificarEvento(
                proyectoId, evento.getAutor().getId());

        eventoRepository.delete(evento);
    }

    private Evento buscarEvento(UUID proyectoId, UUID eventoId) {
        return eventoRepository.findByIdAndProyectoId(eventoId, proyectoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Evento no encontrado"));
    }

    private Archivo obtenerImagen(UUID imagenId, UUID proyectoId) {
        if (imagenId == null) {
            return null;
        }

        return archivoRepository.findByIdAndProyectoId(imagenId, proyectoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La imagen no pertenece al proyecto"));
    }

    private void validar(EventoRequest request) {

        if (request == null || request.titulo() == null
                || request.titulo().isBlank()
                || request.titulo().length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Título inválido");
        }

        if (request.fecha() == null
                || request.horaInicio() == null
                || request.horaFin() == null
                || !request.horaFin().isAfter(request.horaInicio())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Fecha u horarios inválidos");
        }

        if (request.descripcion() != null) {
            int bytes = request.descripcion()
                    .getBytes(StandardCharsets.UTF_8).length;

            // AES-GCM agrega 12 bytes de IV y 16 bytes de autenticación.
            if (bytes + 28 > 4096) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La descripción supera el tamaño permitido");
            }
        }
    }

    private EventoResponse convertir(Evento evento) {
        return new EventoResponse(
                evento.getId(),
                evento.getProyecto().getId(),
                evento.getAutor().getId(),
                evento.getTitulo(),
                evento.getDescripcion(),
                evento.getFecha(),
                evento.getHoraInicio(),
                evento.getHoraFin(),
                evento.getImagen() == null
                        ? null : evento.getImagen().getId(),
                evento.getCreadoEn()
        );
    }
}