package com.trama.tpo.demo.service;

import java.util.UUID;
import java.util.List;
import java.util.Set;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.repository.MembresiaRepository;

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

    // Al crear todavía no existe proyecto ni membresía: cualquier usuario autenticado
    // puede crear uno y queda como su tutor administrador.
    public UUID verificarPuedeCrearProyecto() {
        return usuarioActual.obtenerId();
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

    // Igual que verificarPuedeEditar, pero devuelve true/false en vez de lanzar
    // (lo usa el front para mostrar u ocultar los botones de cargar y editar).
    public boolean puedeEditar(UUID proyectoId) {
        verificarMiembro(proyectoId);
        try {
            verificarPuedeEditar(proyectoId);
            return true;
        } catch (AccessDeniedException sinPermisoDeEdicion) {
            return false;
        }
    }

    // 3b. VERIFICAR QUE PUEDE CARGAR NOTAS PROFESIONALES (4.2)
    // Solo los profesionales de educación y salud, y solo donde pueden editar (freemium).
    public void verificarPuedeCargarNotas(UUID proyectoId) {

        verificarPuedeEditar(proyectoId);

        Rol rol = obtenerMembresia(proyectoId).getRol();

        if (rol != Rol.EDUCACION && rol != Rol.SALUD) {
            throw new AccessDeniedException(
                    "Solo los profesionales de educación o salud pueden cargar notas"
            );
        }
    }

    // Igual que verificarPuedeCargarNotas, pero devuelve true/false (lo usa el front).
    public boolean puedeCargarNotas(UUID proyectoId) {
        verificarMiembro(proyectoId);
        try {
            verificarPuedeCargarNotas(proyectoId);
            return true;
        } catch (AccessDeniedException sinPermisoParaNotas) {
            return false;
        }
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

        if (!visibilidadesPermitidas(membresia.getRol()).contains(visibilidad)) {
            throw new AccessDeniedException(
                    "No tenés permiso para ver este aporte"
            );
        }
    }

    // 6. VISIBILIDADES QUE PUEDE VER CADA ROL
    // Única fuente de la regla: la usan este chequeo y el listado filtrado en la base.
    public static List<Visibilidad> visibilidadesPermitidas(Rol rol) {

        return switch (rol) {

            // Los tutores siempre pueden ver todos los aportes
            case TUTOR -> List.of(Visibilidad.values());

            case SALUD -> List.of(Visibilidad.TODOS, Visibilidad.SOLO_SALUD);

            case EDUCACION -> List.of(Visibilidad.TODOS, Visibilidad.SOLO_EDUCACION);

            case FAMILIAR -> List.of(Visibilidad.TODOS);
        };
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
