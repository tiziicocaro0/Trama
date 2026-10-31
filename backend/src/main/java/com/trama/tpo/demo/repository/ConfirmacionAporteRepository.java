package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.ConfirmacionAporte;
import com.trama.tpo.demo.aporte.ConfirmacionAporteId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ConfirmacionAporteRepository
        extends JpaRepository<ConfirmacionAporte, ConfirmacionAporteId> {

    // Para el listado: todas las confirmaciones de los aportes que se muestran, en una sola consulta
    List<ConfirmacionAporte> findByIdAporteIdIn(Collection<UUID> aporteIds);
}
