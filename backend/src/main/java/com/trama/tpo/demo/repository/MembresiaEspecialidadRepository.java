package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.membresia.MembresiaEspecialidad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MembresiaEspecialidadRepository extends JpaRepository<MembresiaEspecialidad, UUID> {

    List<MembresiaEspecialidad> findByMembresiaId(UUID membresiaId);

    void deleteByMembresiaId(UUID membresiaId);
}
