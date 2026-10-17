package com.trama.tpo.demo.aporte;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AporteVersionRepository extends JpaRepository<AporteVersion, UUID> {
    List<AporteVersion> findByAporteIdOrderByCreadoEnAsc(UUID aporteId);
}
