package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.usuario.TokenRecuperacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, UUID> {

    // Codigos todavia no usados de un usuario (para invalidarlos al pedir uno nuevo).
    List<TokenRecuperacion> findByUsuarioIdAndUsadoEnIsNull(UUID usuarioId);

    // El codigo vigente es el ultimo que se pidio y no se uso.
    Optional<TokenRecuperacion> findFirstByUsuarioIdAndUsadoEnIsNullOrderByCreadoEnDesc(UUID usuarioId);
}
