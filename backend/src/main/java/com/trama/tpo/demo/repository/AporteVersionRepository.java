package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.AporteVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AporteVersionRepository
        extends JpaRepository<AporteVersion, UUID> {
}