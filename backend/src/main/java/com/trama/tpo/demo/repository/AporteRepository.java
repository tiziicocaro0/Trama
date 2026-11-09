package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
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

    // 8.4: lo que una persona cargó en el proyecto, activo y archivado, del más nuevo al más viejo
    List<Aporte> findByProyectoIdAndAutorIdOrderByCreadoEnDesc(
            UUID proyectoId,
            UUID autorId
    );

    List<Aporte> findByProyectoIdAndArchivosId(
            UUID proyectoId,
            UUID archivoId
    );

    // Listar solamente los aportes visibles para el usuario
    @Query("""
            SELECT a
            FROM Aporte a
            WHERE a.proyecto.id = :proyectoId
              AND a.archivado = :archivado
              AND (:tipo IS NULL OR a.tipo = :tipo)
              AND a.visibilidad IN :visibilidades
              AND (:tipoOculto IS NULL OR a.tipo <> :tipoOculto)
            ORDER BY a.creadoEn DESC
            """)
    List<Aporte> buscarAportesVisibles(
            @Param("proyectoId") UUID proyectoId,
            @Param("archivado") Boolean archivado,
            @Param("tipo") TipoAporte tipo,
            @Param("visibilidades") List<Visibilidad> visibilidades,
            // 1.8: NOTA_PROFESIONAL para un familiar sin permiso de ver notas; si no, null
            @Param("tipoOculto") TipoAporte tipoOculto
    );

    // 7.1: Contar aportes visibles creados en los ultimos 7 dias para el panel profesional
    @Query("""
            SELECT COUNT(a)
            FROM Aporte a
            WHERE a.proyecto.id = :proyectoId
              AND a.archivado = false
              AND a.visibilidad IN :visibilidades
              AND (:tipoOculto IS NULL OR a.tipo <> :tipoOculto)
              AND a.creadoEn >= :desde
            """)
    long contarAportesNuevosVisibles(
            @Param("proyectoId") UUID proyectoId,
            @Param("visibilidades") List<Visibilidad> visibilidades,
            @Param("tipoOculto") TipoAporte tipoOculto,
            @Param("desde") Instant desde
    );
}
