package com.trama.tpo.demo.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.registro.RegistroAccion;

/**
 * Auditoría (0.2): solo se puede guardar y consultar.
 * Extiende Repository y no JpaRepository a propósito: no hay métodos para borrar ni modificar.
 */
public interface RegistroAccionRepository extends Repository<RegistroAccion, UUID> {

    RegistroAccion save(RegistroAccion registro);

    List<RegistroAccion> findByProyectoIdOrderByFechaDesc(UUID proyectoId);

    // 8.0: registros del proyecto en un rango de fechas, con filtro opcional por miembro
    @Query("""
            SELECT r FROM RegistroAccion r
            WHERE r.proyectoId = :proyectoId
              AND r.fecha >= :desde AND r.fecha < :hasta
              AND (:usuarioId IS NULL OR r.usuarioId = :usuarioId)
            ORDER BY r.fecha DESC
            """)
    List<RegistroAccion> buscarAccesos(
            @Param("proyectoId") UUID proyectoId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta,
            @Param("usuarioId") UUID usuarioId);

    // 8.0: ¿esta persona ya consultó el perfil desde cierto momento?
    boolean existsByUsuarioIdAndProyectoIdAndAccionAndFechaGreaterThanEqual(
            UUID usuarioId, UUID proyectoId, AccionRegistro accion, Instant desde);
}
