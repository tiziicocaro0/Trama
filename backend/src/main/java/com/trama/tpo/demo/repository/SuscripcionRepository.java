package com.trama.tpo.demo.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trama.tpo.demo.entity.plan.Suscripcion;

@Repository
public interface SuscripcionRepository extends JpaRepository<Suscripcion, UUID> {
}
