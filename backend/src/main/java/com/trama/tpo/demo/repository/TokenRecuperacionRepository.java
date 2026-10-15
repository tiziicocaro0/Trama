package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.usuario.TokenRecuperacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, UUID> {

    Optional<TokenRecuperacion> findByTokenHash(String tokenHash);
}
