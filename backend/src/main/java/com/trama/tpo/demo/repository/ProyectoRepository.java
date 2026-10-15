package com.trama.tpo.demo.repository;

import com.trama.tpo.demo.entity.dto.MiProyectoDTO;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProyectoRepository extends JpaRepository<Proyecto, UUID> {

    /** 1.10 Mis proyectos: solo los proyectos donde el usuario es miembro, con su rol en cada uno. */
    @Query("""
            select new com.trama.tpo.demo.entity.dto.MiProyectoDTO(
                p.id, p.nombre, p.apodo, p.fotoArchivoId, m.rol, m.esAdmin, p.eliminacionProgramada)
            from Membresia m join m.proyecto p
            where m.usuario.id = :usuarioId
            order by p.nombre
            """)
    List<MiProyectoDTO> findMisProyectos(@Param("usuarioId") UUID usuarioId);

    /** 8.2: tarea diaria que borra los proyectos cuya eliminación ya venció. */
    List<Proyecto> findByEliminacionProgramadaBefore(Instant ahora);
}
