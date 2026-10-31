package com.trama.tpo.demo.service;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.PreferenciaNotificacionDto;
import com.trama.tpo.demo.entity.notificacion.PreferenciaNotificacion;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.PreferenciaNotificacionRepository;

/**
 * 6.1: qué notificaciones quiere recibir cada usuario también por mail.
 * Por defecto todas (como el DEFAULT TRUE de la tabla): solo se guarda una fila al cambiarla.
 */
@Service
public class PreferenciaNotificacionService {

    private final PreferenciaNotificacionRepository preferenciaRepository;
    private final UsuarioActual usuarioActual;

    public PreferenciaNotificacionService(
            PreferenciaNotificacionRepository preferenciaRepository,
            UsuarioActual usuarioActual) {

        this.preferenciaRepository = preferenciaRepository;
        this.usuarioActual = usuarioActual;
    }

    // Un interruptor por cada tipo configurable, siempre en el mismo orden.
    @Transactional(readOnly = true)
    public List<PreferenciaNotificacionDto> listar() {

        Map<TipoNotificacion, Boolean> guardadas = preferenciaRepository
                .findByUsuarioId(usuarioActual.obtenerId())
                .stream()
                .collect(Collectors.toMap(
                        PreferenciaNotificacion::getTipo, PreferenciaNotificacion::getPorEmail));

        return TipoNotificacion.configurables().stream()
                .map(tipo -> new PreferenciaNotificacionDto(tipo, guardadas.getOrDefault(tipo, true)))
                .toList();
    }

    // Guarda solo los tipos que vienen; el resto queda como estaba.
    @Transactional
    public List<PreferenciaNotificacionDto> guardar(List<PreferenciaNotificacionDto> cambios) {

        if (cambios == null || cambios.isEmpty()) {
            throw new ApiException(
                    "PREFERENCIAS_VACIAS", "Indicá al menos una preferencia", HttpStatus.BAD_REQUEST);
        }

        UUID usuarioId = usuarioActual.obtenerId();
        Set<TipoNotificacion> vistos = new HashSet<>();

        for (PreferenciaNotificacionDto cambio : cambios) {
            if (cambio == null || cambio.tipo() == null || cambio.porEmail() == null) {
                throw new ApiException(
                        "PREFERENCIA_INVALIDA", "Cada preferencia necesita tipo y porEmail",
                        HttpStatus.BAD_REQUEST);
            }
            if (!cambio.tipo().isConfigurable()) {
                throw new ApiException(
                        "TIPO_NO_CONFIGURABLE",
                        "Las invitaciones siempre llegan por mail: no se pueden apagar",
                        HttpStatus.BAD_REQUEST);
            }
            if (!vistos.add(cambio.tipo())) {
                throw new ApiException(
                        "PREFERENCIA_REPETIDA", "Hay un tipo repetido", HttpStatus.BAD_REQUEST);
            }
        }

        for (PreferenciaNotificacionDto cambio : cambios) {
            preferenciaRepository.save(PreferenciaNotificacion.builder()
                    .usuarioId(usuarioId)
                    .tipo(cambio.tipo())
                    .porEmail(cambio.porEmail())
                    .build());
        }

        return listar();
    }

    // De los destinatarios de una notificación, quiénes la quieren también por mail.
    @Transactional(readOnly = true)
    public Set<UUID> quierenMail(Collection<UUID> usuarioIds, TipoNotificacion tipo) {

        if (tipo == null || !tipo.isConfigurable() || usuarioIds.isEmpty()) {
            return Set.of();
        }

        Set<UUID> apagados = preferenciaRepository
                .findByUsuarioIdInAndTipoAndPorEmailFalse(usuarioIds, tipo)
                .stream()
                .map(PreferenciaNotificacion::getUsuarioId)
                .collect(Collectors.toSet());

        return usuarioIds.stream()
                .filter(id -> !apagados.contains(id))
                .collect(Collectors.toSet());
    }
}
