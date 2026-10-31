package com.trama.tpo.demo.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.trama.tpo.demo.entity.usuario.UsuarioEspecialidad;

public interface UsuarioEspecialidadRepository extends JpaRepository<UsuarioEspecialidad, UUID> {

    List<UsuarioEspecialidad> findByUsuarioIdOrderByEspecialidad(UUID usuarioId);
}
