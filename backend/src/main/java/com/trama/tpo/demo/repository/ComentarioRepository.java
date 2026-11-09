package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.Comentario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ComentarioRepository
        extends JpaRepository<Comentario, UUID> {

    List<Comentario> findByAporteIdOrderByFechaAscIdAsc(
            UUID aporteId
    );
}
