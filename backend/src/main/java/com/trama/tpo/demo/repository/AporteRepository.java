package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AporteRepository extends JpaRepository<Aporte, UUID> {

    Optional<Aporte> findByIdAndProyectoId(
            UUID aporteId,
            UUID proyectoId
    );

    List<Aporte> findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
            UUID proyectoId,
            Boolean archivado
    );

    List<Aporte> findByProyectoIdAndTipoAndArchivadoOrderByCreadoEnDesc(
            UUID proyectoId,
            TipoAporte tipo,
            Boolean archivado
    );
}