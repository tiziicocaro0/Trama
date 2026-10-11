package com.trama.backend.invitacion;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitacionRepository extends JpaRepository<Invitacion, UUID> {

    Optional<Invitacion> findByTokenHash(String tokenHash);

    List<Invitacion> findByProyectoIdAndEstado(UUID proyectoId, EstadoInvitacion estado);
}
