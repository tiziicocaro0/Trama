package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.aporte.Visibilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArchivoRepository extends JpaRepository<Archivo, UUID> {

    Optional<Archivo> findByIdAndProyectoId(UUID id, UUID proyectoId);

    List<Archivo> findByProyectoId(UUID proyectoId);

    // Recursos del niño: se filtra por visibilidad en la consulta, como los aportes
    @Query("""
            SELECT a
            FROM Archivo a
            JOIN FETCH a.autor
            WHERE a.proyecto.id = :proyectoId
              AND a.archivado = false
              AND a.visibilidad IN :visibilidades
            ORDER BY a.fecha DESC
            """)
    List<Archivo> buscarRecursosVisibles(
            @Param("proyectoId") UUID proyectoId,
            @Param("visibilidades") List<Visibilidad> visibilidades
    );
}

