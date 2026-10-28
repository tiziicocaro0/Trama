package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.archivo.Archivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ArchivoRepository extends JpaRepository<Archivo, UUID> {

    Optional<Archivo> findByIdAndProyectoId(UUID id, UUID proyectoId);

    List<Archivo> findByProyectoId(UUID proyectoId);
}

