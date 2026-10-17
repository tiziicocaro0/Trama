package com.trama.tpo.demo.aporte;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface AporteRepository extends JpaRepository<Aporte, UUID> {
    @Query("""
            select a from Aporte a where a.proyectoId = :proyectoId
            and a.archivado = false and a.visibilidad in :visibilidades
            order by a.creadoEn desc, a.id desc
            """)
    List<Aporte> findVisibles(@Param("proyectoId") UUID proyectoId,
            @Param("visibilidades") Set<Visibilidad> visibilidades);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Aporte> findByIdAndProyectoId(UUID id, UUID proyectoId);
}
