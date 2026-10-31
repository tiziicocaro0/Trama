package com.trama.tpo.demo.service;

import java.util.UUID;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.exceptions.SoloLecturaException;
import com.trama.tpo.demo.repository.MembresiaRepository;

@Service
public class PermisoService {

    private final UsuarioActual usuarioActual;
    private final MembresiaRepository membresiaRepository;
    private final PlanService planService;

    public PermisoService(
            UsuarioActual usuarioActual,
            MembresiaRepository membresiaRepository,
            PlanService planService) {

        this.usuarioActual = usuarioActual;
        this.membresiaRepository = membresiaRepository;
        this.planService = planService;
    }

    // Al crear todavía no existe proyecto ni membresía: cualquier usuario autenticado
    // puede crear uno y queda como su tutor administrador.
    // 9.4: hasta PlanService.NINOS_POR_CUENTA niños como tutor, para que nadie
    // use la cuenta de familia como si fuera un plan profesional ilimitado.
    public UUID verificarPuedeCrearProyecto() {
        UUID usuarioId = usuarioActual.obtenerId();

        if (membresiaRepository.countByUsuarioIdAndRol(usuarioId, Rol.TUTOR)
                >= PlanService.NINOS_POR_CUENTA) {
            throw new ApiException(
                    "LIMITE_NINOS",
                    "Cada cuenta puede crear hasta " + PlanService.NINOS_POR_CUENTA
                            + " acompañamientos.",
                    HttpStatus.CONFLICT
            );
        }
        return usuarioId;
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

    // 2b. VERIFICAR QUE ES TUTOR (administrador o co-tutor, 8.0)
    public void verificarTutor(UUID proyectoId) {

        Membresia membresia = obtenerMembresia(proyectoId);

        if (membresia.getRol() != Rol.TUTOR) {
            throw new AccessDeniedException(
                    "Solo los tutores pueden ver el registro de accesos"
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

        // 9.0: los profesionales con plan pago editan en todos sus niños;
        // los gratuitos, únicamente en sus dos proyectos más antiguos
        if (rol == Rol.SALUD || rol == Rol.EDUCACION) {

            UUID usuarioId = usuarioActual.obtenerId();

            if (planService.editaSinLimite(usuarioId)) {
                return;
            }

            List<Membresia> membresiasProfesionales =
                    membresiaRepository
                            .findByUsuarioIdAndRolInOrderByFechaAltaAscIdAsc(
                                    usuarioId,
                                    PlanService.ROLES_PROFESIONALES
                            );

            boolean puedeEditar = membresiasProfesionales.stream()
                    .limit(PlanService.PROYECTOS_GRATUITOS)
                    .anyMatch(m ->
                            m.getProyecto().getId().equals(proyectoId)
                    );

            if (puedeEditar) {
                return;
            }

            throw new SoloLecturaException(
                    "Con el plan gratuito podés editar en 2 niños. "
                    + "Suscribite para editar en todos."
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

    // 9.0: true si el usuario solo puede leer este proyecto por el límite del plan gratuito
    // (lo usa el front para mostrar el aviso de suscripción).
    public boolean soloLecturaPorPlan(UUID proyectoId) {
        verificarMiembro(proyectoId);
        try {
            verificarPuedeEditar(proyectoId);
            return false;
        } catch (SoloLecturaException limiteGratuito) {
            return true;
        } catch (AccessDeniedException otroMotivo) {
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
