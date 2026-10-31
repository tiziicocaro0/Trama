package com.trama.tpo.demo.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trama.tpo.demo.entity.plan.Institucion;

@Repository
public interface InstitucionRepository extends JpaRepository<Institucion, UUID> {

    Optional<Institucion> findByResponsableId(UUID responsableId);

    boolean existsByResponsableId(UUID responsableId);
}
