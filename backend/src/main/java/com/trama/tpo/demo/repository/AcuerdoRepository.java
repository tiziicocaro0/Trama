package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.evento.Acuerdo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AcuerdoRepository extends JpaRepository<Acuerdo, UUID> {

    List<Acuerdo> findByReunionIdOrderByFechaRevisionAsc(UUID reunionId);

    Optional<Acuerdo> findByIdAndReunionProyectoId(UUID id, UUID proyectoId);

    boolean existsByReunionId(UUID reunionId);

    // Aviso diario: vencidos, sin cumplir y todavía sin avisar (usa ix_acuerdo_vencimiento)
    List<Acuerdo> findByCumplidoFalseAndFechaRevisionBeforeAndAvisadoEnIsNull(LocalDate hoy);
}
