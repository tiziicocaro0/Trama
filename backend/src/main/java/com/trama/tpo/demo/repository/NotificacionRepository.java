package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.notificacion.Notificacion;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificacionRepository
        extends JpaRepository<Notificacion, UUID> {

    // Ultimas 10 notificaciones del usuario.
    List<Notificacion> findByUsuarioIdOrderByFechaDesc(
            UUID usuarioId,
            Pageable pageable
    );

    // Cantidad de notificaciones sin leer.
    long countByUsuarioIdAndLeidaFalse(UUID usuarioId);

    // Buscar una notificacion solo si pertenece al usuario.
    Optional<Notificacion> findByIdAndUsuarioId(
            UUID id,
            UUID usuarioId
    );

    // Marcar todas las notificaciones del usuario como leidas.
    @Modifying
    @Query("""
            UPDATE Notificacion n
            SET n.leida = true
            WHERE n.usuario.id = :usuarioId
              AND n.leida = false
            """)
    int marcarTodasComoLeidas(
            @Param("usuarioId") UUID usuarioId
    );
}