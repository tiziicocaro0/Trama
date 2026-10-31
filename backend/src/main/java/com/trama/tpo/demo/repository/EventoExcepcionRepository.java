
package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.evento.EventoExcepcion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventoExcepcionRepository
        extends JpaRepository<EventoExcepcion, UUID> {

    Optional<EventoExcepcion> findByEventoIdAndFechaOcurrencia(
            UUID eventoId,
            LocalDate fechaOcurrencia
    );

    List<EventoExcepcion> findByEventoIdAndFechaOcurrenciaBetween(
            UUID eventoId,
            LocalDate desde,
            LocalDate hasta
    );

    // Eliminar las excepciones de una serie recurrente
    void deleteByEventoId(UUID eventoId);
}