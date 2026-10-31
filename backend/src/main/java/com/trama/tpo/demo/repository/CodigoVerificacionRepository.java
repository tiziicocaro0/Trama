package com.trama.tpo.demo.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trama.tpo.demo.entity.usuario.CodigoVerificacion;

public interface CodigoVerificacionRepository extends JpaRepository<CodigoVerificacion, UUID> {
}
