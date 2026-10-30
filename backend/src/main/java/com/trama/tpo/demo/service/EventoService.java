package com.trama.tpo.demo.service;

import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.EventoRequest;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.evento.EventoExcepcion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EventoService {

    private final EventoRepository eventoRepository;
    private final EventoExcepcionRepository excepcionRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ArchivoRepository archivoRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;

    public EventoService(
            EventoRepository eventoRepository,
            EventoExcepcionRepository excepcionRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            ArchivoRepository archivoRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual) {

        this.eventoRepository = eventoRepository;
        this.excepcionRepository = excepcionRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.archivoRepository = archivoRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
    }

    // CREAR EVENTO UNICO O RECURRENTE
    @Transactional
    public EventoResponse crear(UUID proyectoId, EventoRequest request) {
        permisoService.verificarMiembro(proyectoId);
        validar(request);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "Proyecto no encontrado"));

        Usuario autor = usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"));

        boolean recurrente = Boolean.TRUE.equals(request.recurrente());

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
                .recurrente(recurrente)
                .diaSemana(recurrente ? request.diaSemana() : null)
                .fechaFinRecurrencia(recurrente
                        ? request.fechaFinRecurrencia() : null)
                .esCambio(false)
                .build();

        return convertir(eventoRepository.saveAndFlush(evento));
    }

    // LISTAR EVENTOS Y GENERAR OCURRENCIAS SEMANALES
    @Transactional(readOnly = true)
    public List<EventoResponse> listar(
            UUID proyectoId, LocalDate desde, LocalDate hasta) {

        permisoService.verificarMiembro(proyectoId);

        if (desde == null || hasta == null || hasta.isBefore(desde)) {
            throw error(HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
        }

        List<EventoResponse> resultado = new ArrayList<>();
        List<Evento> eventos = eventoRepository.buscarParaCalendario(
                proyectoId, desde, hasta);

        for (Evento evento : eventos) {
            if (!Boolean.TRUE.equals(evento.getRecurrente())) {
                resultado.add(convertir(evento));
                continue;
            }

            LocalDate inicio = evento.getFecha().isAfter(desde)
                    ? evento.getFecha() : desde;

            LocalDate fin = evento.getFechaFinRecurrencia() == null
                    || evento.getFechaFinRecurrencia().isAfter(hasta)
                    ? hasta : evento.getFechaFinRecurrencia();

            if (inicio.isAfter(fin)) continue;

            Map<LocalDate, EventoExcepcion> excepciones =
                    excepcionRepository
                            .findByEventoIdAndFechaOcurrenciaBetween(
                                    evento.getId(), inicio, fin)
                            .stream()
                            .collect(Collectors.toMap(
                                    EventoExcepcion::getFechaOcurrencia,
                                    Function.identity()));

            LocalDate fecha = inicio.with(
                    TemporalAdjusters.nextOrSame(
                            java.time.DayOfWeek.of(
                                    evento.getDiaSemana().intValue())));

            while (!fecha.isAfter(fin)) {
                EventoExcepcion excepcion = excepciones.get(fecha);

                if (excepcion == null
                        || !Boolean.TRUE.equals(excepcion.getCancelado())) {
                    resultado.add(convertir(evento, fecha, excepcion));
                }

                fecha = fecha.plusWeeks(1);
            }
        }

        resultado.sort(Comparator
                .comparing(EventoResponse::fechaOcurrencia)
                .thenComparing(EventoResponse::horaInicio,
                        Comparator.nullsLast(Comparator.naturalOrder())));

        return resultado;
    }

    // EDITAR EVENTO UNICO O TODA LA SERIE
    @Transactional
    public EventoResponse editar(
            UUID proyectoId, UUID eventoId, EventoRequest request) {

        permisoService.verificarMiembro(proyectoId);
        Evento evento = buscarEvento(proyectoId, eventoId);
        verificarEdicion(proyectoId, evento);
        validar(request);

        boolean recurrente = Boolean.TRUE.equals(request.recurrente());

        boolean cambiaProgramacion =
                !Objects.equals(evento.getRecurrente(), recurrente)
                || !evento.getFecha().equals(request.fecha())
                || (recurrente && !Objects.equals(
                        evento.getDiaSemana(), request.diaSemana()));

        if (cambiaProgramacion) {
            excepcionRepository.deleteByEventoId(eventoId);
            excepcionRepository.flush();
        }

        evento.setTitulo(request.titulo().trim());
        evento.setDescripcion(request.descripcion());
        evento.setFecha(request.fecha());
        evento.setHoraInicio(request.horaInicio());
        evento.setHoraFin(request.horaFin());
        evento.setImagen(obtenerImagen(request.imagenId(), proyectoId));
        evento.setRecurrente(recurrente);
        evento.setDiaSemana(recurrente ? request.diaSemana() : null);
        evento.setFechaFinRecurrencia(recurrente
                ? request.fechaFinRecurrencia() : null);

        return convertir(eventoRepository.saveAndFlush(evento));
    }

    // ELIMINAR EVENTO UNICO O TODA LA SERIE
    @Transactional
    public void eliminar(UUID proyectoId, UUID eventoId) {
        permisoService.verificarMiembro(proyectoId);
        Evento evento = buscarEvento(proyectoId, eventoId);
        verificarEdicion(proyectoId, evento);
        eventoRepository.delete(evento);
    }

    // CANCELAR UNA SOLA OCURRENCIA
    @Transactional
    public void cancelarOcurrencia(
            UUID proyectoId, UUID eventoId, LocalDate fechaOcurrencia) {

        permisoService.verificarMiembro(proyectoId);
        Evento evento = buscarEvento(proyectoId, eventoId);
        verificarEdicion(proyectoId, evento);
        validarOcurrencia(evento, fechaOcurrencia);

        EventoExcepcion excepcion = excepcionRepository
                .findByEventoIdAndFechaOcurrencia(
                        eventoId, fechaOcurrencia)
                .orElseGet(() -> EventoExcepcion.builder()
                        .evento(evento)
                        .fechaOcurrencia(fechaOcurrencia)
                        .build());

        excepcion.setCancelado(true);
        excepcion.setTitulo(null);
        excepcion.setHoraInicio(null);
        excepcion.setHoraFin(null);
        excepcionRepository.saveAndFlush(excepcion);
    }

    private void validarOcurrencia(
            Evento evento, LocalDate fecha) {

        if (!Boolean.TRUE.equals(evento.getRecurrente())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "El evento no es recurrente");
        }

        if (fecha == null
                || fecha.isBefore(evento.getFecha())
                || (evento.getFechaFinRecurrencia() != null
                    && fecha.isAfter(evento.getFechaFinRecurrencia()))
                || fecha.getDayOfWeek().getValue()
                    != evento.getDiaSemana().intValue()) {
            throw error(HttpStatus.BAD_REQUEST,
                    "La fecha no pertenece a la serie");
        }
    }

    private void verificarEdicion(UUID proyectoId, Evento evento) {
        permisoService.verificarPuedeModificarEvento(
                proyectoId, evento.getAutor().getId());
    }

    private Evento buscarEvento(UUID proyectoId, UUID eventoId) {
        return eventoRepository.findByIdAndProyectoId(eventoId, proyectoId)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND,
                        "Evento no encontrado"));
    }

    private Archivo obtenerImagen(UUID imagenId, UUID proyectoId) {
        if (imagenId == null) return null;

        return archivoRepository.findByIdAndProyectoId(imagenId, proyectoId)
                .orElseThrow(() -> error(HttpStatus.BAD_REQUEST,
                        "La imagen no pertenece al proyecto"));
    }

    private void validar(EventoRequest request) {
        if (request == null || request.titulo() == null
                || request.titulo().isBlank()
                || request.titulo().length() > 150) {
            throw error(HttpStatus.BAD_REQUEST, "Titulo invalido");
        }

        if (request.fecha() == null || request.horaInicio() == null
                || request.horaFin() == null
                || !request.horaFin().isAfter(request.horaInicio())) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Fecha u horarios invalidos");
        }

        if (Boolean.TRUE.equals(request.recurrente())) {
            if (request.diaSemana() == null
                    || request.diaSemana() < 1
                    || request.diaSemana() > 7
                    || request.fecha().getDayOfWeek().getValue()
                            != request.diaSemana()) {
                throw error(HttpStatus.BAD_REQUEST,
                        "Dia semanal invalido");
            }

            if (request.fechaFinRecurrencia() != null
                    && request.fechaFinRecurrencia()
                            .isBefore(request.fecha())) {
                throw error(HttpStatus.BAD_REQUEST,
                        "Fecha de fin anterior al inicio");
            }
        }

        if (request.descripcion() != null
                && request.descripcion()
                        .getBytes(StandardCharsets.UTF_8).length + 28 > 4096) {
            throw error(HttpStatus.BAD_REQUEST,
                    "Descripcion demasiado extensa");
        }
    }

    private ResponseStatusException error(
            HttpStatus estado, String mensaje) {
        return new ResponseStatusException(estado, mensaje);
    }

    private EventoResponse convertir(Evento evento) {
        return convertir(evento, evento.getFecha(), null);
    }

    private EventoResponse convertir(
            Evento evento, LocalDate fecha, EventoExcepcion excepcion) {

        String titulo = excepcion != null
                && excepcion.getTitulo() != null
                ? excepcion.getTitulo() : evento.getTitulo();

        java.time.LocalTime inicio = excepcion != null
                && excepcion.getHoraInicio() != null
                ? excepcion.getHoraInicio() : evento.getHoraInicio();

        java.time.LocalTime fin = excepcion != null
                && excepcion.getHoraFin() != null
                ? excepcion.getHoraFin() : evento.getHoraFin();

        return new EventoResponse(
                evento.getId(),
                evento.getProyecto().getId(),
                evento.getAutor().getId(),
                titulo,
                evento.getDescripcion(),
                evento.getFecha(),
                inicio,
                fin,
                evento.getImagen() == null
                        ? null : evento.getImagen().getId(),
                evento.getCreadoEn(),
                evento.getRecurrente(),
                evento.getDiaSemana(),
                evento.getFechaFinRecurrencia(),
                fecha
        );
    }
}