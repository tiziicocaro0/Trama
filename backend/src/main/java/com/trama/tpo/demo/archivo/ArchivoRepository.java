package com.trama.tpo.demo.archivo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ArchivoRepository extends JpaRepository<Archivo, UUID> {

    Optional<Archivo> findByIdAndProyecto_Id(UUID id, UUID proyectoId);

}