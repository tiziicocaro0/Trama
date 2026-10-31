package com.trama.tpo.demo.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trama.tpo.demo.entity.notificacion.PreferenciaNotificacion;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;

@Repository
public interface PreferenciaNotificacionRepository
        extends JpaRepository<PreferenciaNotificacion, PreferenciaNotificacion.Clave> {

    List<PreferenciaNotificacion> findByUsuarioId(UUID usuarioId);

    // 6.1: de una lista de destinatarios, quiénes apagaron el mail para este tipo.
    List<PreferenciaNotificacion> findByUsuarioIdInAndTipoAndPorEmailFalse(
            Collection<UUID> usuarioIds, TipoNotificacion tipo);
}
