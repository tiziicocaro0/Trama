package com.trama.tpo.demo.service;

import java.util.UUID;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.aporte.Visibilidad;

@Service
public class PermisoService {

    private final UsuarioActual usuarioActual;
    private final MembresiaRepository membresiaRepository;

    public PermisoService(
            UsuarioActual usuarioActual,
            MembresiaRepository membresiaRepository) {

        this.usuarioActual = usuarioActual;
        this.membresiaRepository = membresiaRepository;
    }

    // 1. VERIFICAR QUE PERTENECE AL PROYECTO
    public void verificarMiembro(UUID proyectoId) {
        obtenerMembresia(proyectoId);
    }

    // 2. VERIFICAR QUE ES TUTOR ADMINISTRADOR
    public void verificarAdmin(UUID proyectoId) {

        Membresia membresia = obtenerMembresia(proyectoId);

        if (membresia.getRol() != Rol.TUTOR
                || !Boolean.TRUE.equals(membresia.getEsAdmin())) {

            throw new AccessDeniedException(
                    "No tenés permisos de administrador"
            );
        }
    }

    // 3. VERIFICAR QUE PUEDE EDITAR
    public void verificarPuedeEditar(UUID proyectoId) {

        // Verificar que el usuario pertenezca al proyecto
        Membresia membresia = obtenerMembresia(proyectoId);

        Rol rol = membresia.getRol();

        // Los tutores pueden editar
        if (rol == Rol.TUTOR) {
            return;
        }

        // Los familiares pueden editar si el tutor lo habilitó
        if (rol == Rol.FAMILIAR) {
            if (Boolean.TRUE.equals(
                    membresia.getProyecto().getFamiliarPuedeCargar())) {
                return;
            }

            throw new AccessDeniedException(
                    "No tenés permiso para editar este proyecto"
            );
        }

        // Los profesionales gratuitos pueden editar
        // únicamente sus dos proyectos más antiguos
        if (rol == Rol.SALUD || rol == Rol.EDUCACION) {

            UUID usuarioId = usuarioActual.obtenerId();

            List<Membresia> membresiasProfesionales =
                    membresiaRepository
                            .findByUsuarioIdAndRolInOrderByFechaAltaAscIdAsc(
                                    usuarioId,
                                    Set.of(Rol.SALUD, Rol.EDUCACION)
                            );

            boolean puedeEditar = membresiasProfesionales.stream()
                    .limit(2)
                    .anyMatch(m ->
                            m.getProyecto().getId().equals(proyectoId)
                    );

            if (puedeEditar) {
                return;
            }

            throw new AccessDeniedException(
                    "Alcanzaste el límite de dos proyectos gratuitos. "
                    + "Este proyecto está disponible en modo solo lectura."
            );
        }

        throw new AccessDeniedException(
                "No tenés permiso para editar este proyecto"
        );
    }

    // 4. VERIFICAR AUTORÍA DE UN APORTE
    public void verificarAutor(UUID autorId) {

        UUID usuarioId = usuarioActual.obtenerId();

        if (autorId == null || !usuarioId.equals(autorId)) {

            throw new AccessDeniedException(
                    "Solo el autor puede modificar este aporte"
            );
        }
    }

    // 5. VERIFICAR VISIBILIDAD DE UN APORTE
    public void verificarPuedeVerAporte(
            UUID proyectoId,
            Visibilidad visibilidad) {

        Membresia membresia = obtenerMembresia(proyectoId);

        Rol rol = membresia.getRol();

        // Los tutores siempre pueden ver todos los aportes
        if (rol == Rol.TUTOR) {
            return;
        }

        boolean puedeVer = switch (visibilidad) {

            case TODOS -> true;

            case SOLO_TUTORES -> false;

            case SOLO_SALUD -> rol == Rol.SALUD;

            case SOLO_EDUCACION -> rol == Rol.EDUCACION;
        };

        if (!puedeVer) {
            throw new AccessDeniedException(
                    "No tenés permiso para ver este aporte"
            );
        }
    }

    // MÉTODO PRIVADO COMPARTIDO
    private Membresia obtenerMembresia(UUID proyectoId) {

        UUID usuarioId = usuarioActual.obtenerId();

        return membresiaRepository
                .findByUsuarioIdAndProyectoId(usuarioId, proyectoId)
                .orElseThrow(() ->
                        new AccessDeniedException(
                                "No tenés acceso a este proyecto"
                        )
                );
    }
}