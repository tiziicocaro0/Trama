package com.trama.backend.usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, UUID> {

    Optional<TokenRecuperacion> findByTokenHash(String tokenHash);
}
