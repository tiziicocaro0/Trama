package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.evento.Evento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventoRepository
        extends JpaRepository<Evento, UUID> {

    // Buscar un evento dentro de un proyecto específico
    Optional<Evento> findByIdAndProyectoId(
            UUID eventoId,
            UUID proyectoId
    );

    // Obtener eventos de un proyecto entre dos fechas
    List<Evento> findByProyectoIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
            UUID proyectoId,
            LocalDate desde,
            LocalDate hasta
    );
}