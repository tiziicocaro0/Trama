package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.Aporte;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AporteRepository extends JpaRepository<Aporte, UUID> {

    Optional<Aporte> findByIdAndProyectoId(
            UUID aporteId,
            UUID proyectoId
    );
}