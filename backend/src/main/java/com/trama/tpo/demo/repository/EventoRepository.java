package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.evento.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    // Consulta original de la historia 5.0
    List<Evento> findByProyectoIdAndFechaBetweenOrderByFechaAscHoraInicioAsc(
            UUID proyectoId,
            LocalDate desde,
            LocalDate hasta
    );

    // Obtener eventos únicos y series recurrentes
    // que tienen ocurrencias posibles dentro del rango.
    @Query("""
            SELECT e
            FROM Evento e
            WHERE e.proyecto.id = :proyectoId
              AND (
                  (
                      e.recurrente = false
                      AND e.fecha BETWEEN :desde AND :hasta
                  )
                  OR
                  (
                      e.recurrente = true
                      AND e.fecha <= :hasta
                      AND (
                          e.fechaFinRecurrencia IS NULL
                          OR e.fechaFinRecurrencia >= :desde
                      )
                  )
              )
            ORDER BY e.fecha ASC, e.horaInicio ASC
            """)
    List<Evento> buscarParaCalendario(
            @Param("proyectoId") UUID proyectoId,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta
    );
}