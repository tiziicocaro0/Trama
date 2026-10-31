package com.trama.tpo.demo.service;

import com.trama.tpo.demo.entity.dto.EventoOcurrenciaRequest;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.evento.EventoExcepcion;
import com.trama.tpo.demo.repository.EventoRepository;
import com.trama.tpo.demo.repository.EventoExcepcionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.exceptions.ApiException;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Service
public class EventoOcurrenciaService {

    private final EventoRepository eventoRepository;
    private final EventoExcepcionRepository excepcionRepository;
    private final PermisoService permisoService;

    public EventoOcurrenciaService(
            EventoRepository eventoRepository,
            EventoExcepcionRepository excepcionRepository,
            PermisoService permisoService) {

        this.eventoRepository = eventoRepository;
        this.excepcionRepository = excepcionRepository;
        this.permisoService = permisoService;
    }

    @Transactional
    public void editarOcurrencia(
            UUID proyectoId,
            UUID eventoId,
            LocalDate fecha,
            EventoOcurrenciaRequest request) {

        permisoService.verificarMiembro(proyectoId);

        Evento evento = eventoRepository
                .findByIdAndProyectoId(eventoId, proyectoId)
                .orElseThrow(() -> new ApiException("EVENTO_NO_ENCONTRADO",
                        "Evento no encontrado", HttpStatus.NOT_FOUND));

        permisoService.verificarPuedeModificarEvento(
                proyectoId, evento.getAutor().getId());

        validarFecha(evento, fecha);

        if (request == null || request.titulo() == null
                || request.titulo().isBlank()
                || request.titulo().length() > 150) {
            throw new ApiException("TITULO_INVALIDO",
                    "Titulo invalido", HttpStatus.BAD_REQUEST);
        }

        LocalTime inicio = request.horaInicio() != null
                ? request.horaInicio() : evento.getHoraInicio();

        LocalTime fin = request.horaFin() != null
                ? request.horaFin() : evento.getHoraFin();

        if (inicio == null || fin == null || !fin.isAfter(inicio)) {
            throw new ApiException("HORARIO_INVALIDO",
                    "Horarios invalidos", HttpStatus.BAD_REQUEST);
        }

        EventoExcepcion excepcion = excepcionRepository
                .findByEventoIdAndFechaOcurrencia(eventoId, fecha)
                .orElseGet(() -> EventoExcepcion.builder()
                        .evento(evento)
                        .fechaOcurrencia(fecha)
                        .build());

        excepcion.setCancelado(false);
        excepcion.setTitulo(request.titulo().trim());
        excepcion.setHoraInicio(inicio);
        excepcion.setHoraFin(fin);

        excepcionRepository.saveAndFlush(excepcion);
    }

    private void validarFecha(Evento evento, LocalDate fecha) {

        if (!Boolean.TRUE.equals(evento.getRecurrente())
                || fecha == null
                || fecha.isBefore(evento.getFecha())
                || (evento.getFechaFinRecurrencia() != null
                    && fecha.isAfter(evento.getFechaFinRecurrencia()))
                || fecha.getDayOfWeek().getValue()
                        != evento.getDiaSemana().intValue()) {

            throw new ApiException("FECHA_FUERA_DE_SERIE",
                    "La fecha no pertenece a la serie recurrente", HttpStatus.BAD_REQUEST);
        }
    }
}