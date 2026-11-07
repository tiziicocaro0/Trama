package com.trama.tpo.demo.service;

import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.ActaRequest;
import com.trama.tpo.demo.entity.dto.EventoRequest;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.evento.EventoExcepcion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;

import com.trama.tpo.demo.exceptions.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final MembresiaRepository membresiaRepository;
    private final ArchivoRepository archivoRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final AcuerdoRepository acuerdoRepository;
    private final NotificacionService notificacionService;

    public EventoService(
            EventoRepository eventoRepository,
            EventoExcepcionRepository excepcionRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            ArchivoRepository archivoRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            AcuerdoRepository acuerdoRepository,
            NotificacionService notificacionService) {

        this.eventoRepository = eventoRepository;
        this.excepcionRepository = excepcionRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.archivoRepository = archivoRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.acuerdoRepository = acuerdoRepository;
        this.notificacionService = notificacionService;
    }

    // CREAR EVENTO UNICO O RECURRENTE (COMUN O REUNION)
    @Transactional
    public EventoResponse crear(UUID proyectoId, EventoRequest request) {
        permisoService.verificarMiembro(proyectoId);
        validar(request);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> error("PROYECTO_NO_ENCONTRADO", HttpStatus.NOT_FOUND,
                        "Proyecto no encontrado"));

        Usuario autor = usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> error("USUARIO_NO_ENCONTRADO", HttpStatus.NOT_FOUND,
                        "Usuario no encontrado"));

        boolean recurrente = Boolean.TRUE.equals(request.recurrente());
        String tipo = "REUNION".equalsIgnoreCase(request.tipo()) ? "REUNION" : "COMUN";
        List<Usuario> participantes = resolverParticipantes(proyectoId, request.participanteIds(), tipo);

        Evento evento = Evento.builder()
                .proyecto(proyecto)
                .autor(autor)
                .titulo(request.titulo().trim())
                .descripcion(request.descripcion())
                .fecha(request.fecha())
                .horaInicio(request.horaInicio())
                .horaFin(request.horaFin())
                .imagen(obtenerImagen(request.imagenId(), proyectoId))
                .tipo(tipo)
                .recurrente(recurrente)
                .diaSemana(recurrente ? request.diaSemana() : null)
                .fechaFinRecurrencia(recurrente
                        ? request.fechaFinRecurrencia() : null)
                .esCambio(Boolean.TRUE.equals(request.esCambio()))
                .participantes(participantes)
                .build();

        Evento guardado = eventoRepository.saveAndFlush(evento);

        if (Boolean.TRUE.equals(request.esCambio())) {
            notificarCambioRutina(proyectoId);
        }

        return convertir(guardado);
            }

    // LISTAR EVENTOS Y GENERAR OCURRENCIAS SEMANALES
    @Transactional(readOnly = true)
    public List<EventoResponse> listar(
            UUID proyectoId, LocalDate desde, LocalDate hasta) {

        permisoService.verificarMiembro(proyectoId);

        if (desde == null || hasta == null || hasta.isBefore(desde)) {
            throw error("RANGO_INVALIDO", HttpStatus.BAD_REQUEST, "Rango de fechas invalido");
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

        String tipo = request.tipo() != null
                ? ("REUNION".equalsIgnoreCase(request.tipo()) ? "REUNION" : "COMUN")
                : evento.getTipo();

        // 5.5: una reunión con acta no puede volver a ser un evento común (la base lo
        // prohíbe con ck_evento_acta y daría un 500): se avisa con un error claro.
        if (evento.getActa() != null && !"REUNION".equals(tipo)) {
            throw error("REUNION_CON_ACTA", HttpStatus.CONFLICT,
                    "Esta reunión ya tiene acta: no puede pasar a ser un evento común");
        }
        // 5.6: tampoco si ya tiene acuerdos
        if ("REUNION".equals(evento.getTipo()) && !"REUNION".equals(tipo)
                && acuerdoRepository.existsByReunionId(eventoId)) {
            throw error("REUNION_CON_ACUERDOS", HttpStatus.CONFLICT,
                    "La reunión tiene acuerdos: no puede pasar a ser un evento común");
        }

        List<Usuario> participantes = request.participanteIds() != null
                ? resolverParticipantes(proyectoId, request.participanteIds(), tipo)
                : evento.getParticipantes();

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
        evento.setTipo(tipo);
        evento.setParticipantes(participantes);

        if (request.esCambio() != null) {
            evento.setEsCambio(request.esCambio());
        }

        Evento guardado = eventoRepository.saveAndFlush(evento);

        if (Boolean.TRUE.equals(request.esCambio())) {
            notificarCambioRutina(proyectoId);
        }

        return convertir(guardado);
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

    // 5.5: REGISTRAR O ACTUALIZAR EL ACTA DE UNA REUNIÓN (SOLO PARTICIPANTES)
    @Transactional
    public void guardarActa(UUID proyectoId, UUID eventoId, ActaRequest request) {
        permisoService.verificarMiembro(proyectoId);
        Evento evento = buscarEvento(proyectoId, eventoId);

        if (!"REUNION".equalsIgnoreCase(evento.getTipo())) {
            throw error("NO_ES_REUNION", HttpStatus.BAD_REQUEST, "Solo las reuniones tienen acta");
        }

        UUID usuarioId = usuarioActual.obtenerId();
        boolean esParticipante = evento.getParticipantes().stream()
                .anyMatch(u -> u.getId().equals(usuarioId))
                || (evento.getAutor() != null && evento.getAutor().getId().equals(usuarioId));

        if (!esParticipante) {
            throw new AccessDeniedException("Solo los participantes de la reunión pueden registrar el acta");
        }

        if (request == null || request.acta() == null || request.acta().isBlank()) {
            throw error("ACTA_INVALIDA", HttpStatus.BAD_REQUEST, "El acta no puede estar vacía");
        }

        evento.setActa(request.acta().trim());
        eventoRepository.saveAndFlush(evento);
    }

    private List<Usuario> resolverParticipantes(UUID proyectoId, List<UUID> participanteIds, String tipo) {
        if (!"REUNION".equalsIgnoreCase(tipo) || participanteIds == null || participanteIds.isEmpty()) {
            return new ArrayList<>();
        }

        Set<UUID> miembrosValidos = membresiaRepository.findByProyectoId(proyectoId).stream()
                .map(m -> m.getUsuario().getId())
                .collect(Collectors.toSet());

        List<Usuario> lista = new ArrayList<>();
        for (UUID uId : participanteIds) {
            if (uId == null || !miembrosValidos.contains(uId)) {
                throw error("PARTICIPANTE_INVALIDO", HttpStatus.BAD_REQUEST,
                        "Los participantes deben ser miembros de la red del niño");
            }
            usuarioRepository.findById(uId).ifPresent(lista::add);
        }
        return lista;
    }

    private void validarOcurrencia(
            Evento evento, LocalDate fecha) {

        if (!Boolean.TRUE.equals(evento.getRecurrente())) {
            throw error("EVENTO_NO_RECURRENTE", HttpStatus.BAD_REQUEST,
                    "El evento no es recurrente");
        }

        if (fecha == null
                || fecha.isBefore(evento.getFecha())
                || (evento.getFechaFinRecurrencia() != null
                    && fecha.isAfter(evento.getFechaFinRecurrencia()))
                || fecha.getDayOfWeek().getValue()
                    != evento.getDiaSemana().intValue()) {
            throw error("FECHA_FUERA_DE_SERIE", HttpStatus.BAD_REQUEST,
                    "La fecha no pertenece a la serie");
        }
    }

    private void verificarEdicion(UUID proyectoId, Evento evento) {
        permisoService.verificarPuedeModificarEvento(
                proyectoId, evento.getAutor().getId());
    }

    private Evento buscarEvento(UUID proyectoId, UUID eventoId) {
        return eventoRepository.findByIdAndProyectoId(eventoId, proyectoId)
                .orElseThrow(() -> error("EVENTO_NO_ENCONTRADO", HttpStatus.NOT_FOUND,
                        "Evento no encontrado"));
    }

    private Archivo obtenerImagen(UUID imagenId, UUID proyectoId) {
        if (imagenId == null) return null;

        return archivoRepository.findByIdAndProyectoId(imagenId, proyectoId)
                .orElseThrow(() -> error("IMAGEN_NO_ENCONTRADA", HttpStatus.BAD_REQUEST,
                        "La imagen no pertenece al proyecto"));
    }

    private void validar(EventoRequest request) {
        if (request == null || request.titulo() == null
                || request.titulo().isBlank()
                || request.titulo().length() > 150) {
            throw error("TITULO_INVALIDO", HttpStatus.BAD_REQUEST, "Titulo invalido");
        }

        if (request.fecha() == null || request.horaInicio() == null
                || request.horaFin() == null
                || !request.horaFin().isAfter(request.horaInicio())) {
            throw error("HORARIO_INVALIDO", HttpStatus.BAD_REQUEST,
                    "Fecha u horarios invalidos");
        }

        if (Boolean.TRUE.equals(request.recurrente())) {
            if (request.diaSemana() == null
                    || request.diaSemana() < 1
                    || request.diaSemana() > 7
                    || request.fecha().getDayOfWeek().getValue()
                            != request.diaSemana()) {
                throw error("DIA_SEMANA_INVALIDO", HttpStatus.BAD_REQUEST,
                        "Dia semanal invalido");
            }

            if (request.fechaFinRecurrencia() != null
                    && request.fechaFinRecurrencia()
                            .isBefore(request.fecha())) {
                throw error("FIN_RECURRENCIA_INVALIDO", HttpStatus.BAD_REQUEST,
                        "Fecha de fin anterior al inicio");
            }
        }

        if (request.descripcion() != null
                && request.descripcion()
                        .getBytes(StandardCharsets.UTF_8).length + 28 > 4096) {
            throw error("DESCRIPCION_MUY_LARGA", HttpStatus.BAD_REQUEST,
                    "Descripcion demasiado extensa");
        }
    }

    private static ApiException error(
            String codigo, HttpStatus estado, String mensaje) {
        return new ApiException(codigo, mensaje, estado);
    }

    // 8.1: todos los eventos del proyecto, cada serie una sola vez (sin expandir las ocurrencias)
    @Transactional(readOnly = true)
    public List<EventoResponse> listarParaExportar(UUID proyectoId) {
        permisoService.verificarMiembro(proyectoId);

        return eventoRepository.findByProyectoIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
                        proyectoId, LocalDate.of(1900, 1, 1), LocalDate.of(9999, 12, 31))
                .stream()
                .map(this::convertir)
                .toList();
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

        List<UUID> participanteIds = evento.getParticipantes() != null
                ? evento.getParticipantes().stream().map(Usuario::getId).toList()
                : List.of();

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
                evento.getEsCambio(),
                evento.getDiaSemana(),
                evento.getFechaFinRecurrencia(),
                fecha,
                evento.getTipo(),
                evento.getActa(),
                participanteIds
        );
    }
    private void notificarCambioRutina(UUID proyectoId) {

    UUID autorId = usuarioActual.obtenerId();

    List<UUID> destinatarios = membresiaRepository
            .findByProyectoId(proyectoId)
            .stream()
            .map(membresia -> membresia.getUsuario().getId())
            .filter(id -> !id.equals(autorId))
            .distinct()
            .toList();

    notificacionService.notificar(
            destinatarios,
            proyectoId,
            TipoNotificacion.CAMBIO_CALENDARIO.name(),
            "Se registró un cambio de rutina en el calendario.",
            "/proyectos/" + proyectoId + "/calendario"
    );
}
}
