package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MembresiaRepository extends JpaRepository<Membresia, UUID> {

    /** Para el PermisoService (0.1): el rol del usuario en ese niño, o vacío si no es miembro. */
    @Query("select m.rol from Membresia m where m.usuario.id = :usuarioId and m.proyecto.id = :proyectoId")
    Optional<Rol> findRol(@Param("usuarioId") UUID usuarioId, @Param("proyectoId") UUID proyectoId);

    boolean existsByUsuarioIdAndProyectoId(UUID usuarioId, UUID proyectoId);

    List<Membresia> findByProyectoId(UUID proyectoId);
}
