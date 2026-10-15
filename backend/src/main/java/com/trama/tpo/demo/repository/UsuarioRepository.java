package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.usuario.Usuario;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // La collation utf8mb4_0900_ai_ci ya compara sin distinguir mayúsculas
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    // Bloquear la fila del usuario durante una actualización
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findByIdForUpdate(@Param("id") UUID id);
}