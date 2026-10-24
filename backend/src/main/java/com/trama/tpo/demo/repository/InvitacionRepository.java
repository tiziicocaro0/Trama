package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.invitacion.Invitacion;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitacionRepository extends JpaRepository<Invitacion, UUID> {

    // Consultar una invitacion mediante el hash de su token.
    Optional<Invitacion> findByTokenHash(String tokenHash);

    // Consultar las invitaciones de un proyecto segun su estado.
    List<Invitacion> findByProyectoIdAndEstado(
            UUID proyectoId,
            EstadoInvitacion estado
    );

    // Bloquear la invitacion mientras se procesa su aceptacion.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Invitacion i WHERE i.tokenHash = :tokenHash")
    Optional<Invitacion> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash
    );
}
