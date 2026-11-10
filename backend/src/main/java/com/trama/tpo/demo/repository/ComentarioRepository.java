package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.aporte.Comentario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ComentarioRepository
        extends JpaRepository<Comentario, UUID> {

    List<Comentario> findByAporteIdOrderByFechaAscIdAsc(
            UUID aporteId
    );

    // 6.2: cuántos comentarios tiene cada aporte de un listado, en una sola consulta
    @Query("SELECT c.aporte.id, COUNT(c) FROM Comentario c WHERE c.aporte.id IN :aporteIds GROUP BY c.aporte.id")
    List<Object[]> contarPorAporte(@Param("aporteIds") Collection<UUID> aporteIds);
}
