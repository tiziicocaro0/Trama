package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // Listar solamente los aportes visibles para el usuario
    @Query("""
            SELECT a
            FROM Aporte a
            WHERE a.proyecto.id = :proyectoId
              AND a.archivado = :archivado
              AND (:tipo IS NULL OR a.tipo = :tipo)
              AND a.visibilidad IN :visibilidades
            ORDER BY a.creadoEn DESC
            """)
    List<Aporte> buscarAportesVisibles(
            @Param("proyectoId") UUID proyectoId,
            @Param("archivado") Boolean archivado,
            @Param("tipo") TipoAporte tipo,
            @Param("visibilidades") List<Visibilidad> visibilidades
    );
      // Buscar los aportes a los que está vinculado un archivo.
    @Query("""
            SELECT DISTINCT a
            FROM Aporte a
            JOIN a.archivos archivo
            WHERE archivo.id = :archivoId
              AND a.proyecto.id = :proyectoId
            """)
    List<Aporte> buscarAportesPorArchivo(
            @Param("proyectoId") UUID proyectoId,
            @Param("archivoId") UUID archivoId
    );
}