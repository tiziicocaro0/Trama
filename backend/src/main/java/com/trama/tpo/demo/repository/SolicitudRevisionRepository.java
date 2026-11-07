package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.EstadoRevision;
import com.trama.tpo.demo.aporte.SolicitudRevision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SolicitudRevisionRepository
        extends JpaRepository<SolicitudRevision, UUID> {

    // Buscar solicitudes pendientes de un aporte
    List<SolicitudRevision> findByAporteIdAndEstado(
            UUID aporteId,
            EstadoRevision estado
    );

    // Comprobar si ya existe una revisión pendiente
    boolean existsByAporteIdAndEstado(
            UUID aporteId,
            EstadoRevision estado
    );

    // Buscar una revisión dentro de un proyecto específico
    Optional<SolicitudRevision> findByIdAndAporteProyectoId(
            UUID revisionId,
            UUID proyectoId
    );
        // Busca las solicitudes de revisión de varios aportes que tengan un estado específico.
        // Permite obtener todas las revisiones pendientes en una sola consulta a la base de datos.
        List<SolicitudRevision> findByAporteIdInAndEstado(
                List<UUID> aporteIds,
                EstadoRevision estado
        );
}