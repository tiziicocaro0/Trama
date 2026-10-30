package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.AporteVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface AporteVersionRepository
        extends JpaRepository<AporteVersion, UUID> {

    // 3.2: versiones anteriores de un aporte, de la más vieja a la más nueva
    List<AporteVersion> findByAporteIdOrderByCreadoEnAsc(UUID aporteId);

    @Modifying
    @Transactional
    @Query("""
            DELETE FROM AporteVersion v
            WHERE v.aporte.proyecto.id = :proyectoId
            """)
    void eliminarPorProyectoId(@Param("proyectoId") UUID proyectoId);
}