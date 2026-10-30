package com.trama.tpo.demo.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.plan.LicenciaProfesional;

@Repository
public interface LicenciaProfesionalRepository extends JpaRepository<LicenciaProfesional, UUID> {

    @Query("""
            select l from LicenciaProfesional l join fetch l.usuario
            where l.institucion.id = :institucionId
            order by l.usuario.nombre, l.usuario.apellido
            """)
    List<LicenciaProfesional> listarDeInstitucion(@Param("institucionId") UUID institucionId);

    boolean existsByInstitucionIdAndUsuarioId(UUID institucionId, UUID usuarioId);

    Optional<LicenciaProfesional> findByIdAndInstitucionId(UUID id, UUID institucionId);

    /** Licencia vigente del profesional (para PlanService y la página Mi plan). */
    @Query("""
            select l from LicenciaProfesional l join fetch l.institucion
            where l.usuario.id = :usuarioId and (l.hasta is null or l.hasta >= :hoy)
            """)
    List<LicenciaProfesional> vigentesDe(@Param("usuarioId") UUID usuarioId, @Param("hoy") LocalDate hoy);

    @Query("""
            select count(l) from LicenciaProfesional l
            where l.institucion.id = :institucionId and (l.hasta is null or l.hasta >= :hoy)
            """)
    long contarProfesionales(@Param("institucionId") UUID institucionId, @Param("hoy") LocalDate hoy);

    /** Niños cubiertos: proyectos distintos donde un profesional con licencia vigente trabaja como tal. */
    @Query("""
            select count(distinct m.proyecto.id) from Membresia m
            where m.rol in :roles and m.usuario.id in (
                select l.usuario.id from LicenciaProfesional l
                where l.institucion.id = :institucionId and (l.hasta is null or l.hasta >= :hoy))
            """)
    long contarNinos(@Param("institucionId") UUID institucionId, @Param("hoy") LocalDate hoy,
            @Param("roles") Collection<Rol> roles);
}
