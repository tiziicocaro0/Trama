package com.trama.tpo.demo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.repository.Repository;

import com.trama.tpo.demo.entity.registro.RegistroAccion;

/**
 * Auditoría (0.2): solo se puede guardar y consultar.
 * Extiende Repository y no JpaRepository a propósito: no hay métodos para borrar ni modificar.
 */
public interface RegistroAccionRepository extends Repository<RegistroAccion, UUID> {

    RegistroAccion save(RegistroAccion registro);

    List<RegistroAccion> findByProyectoIdOrderByFechaDesc(UUID proyectoId);
}
