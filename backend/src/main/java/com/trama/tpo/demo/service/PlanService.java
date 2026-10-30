package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.plan.Institucion;
import com.trama.tpo.demo.entity.plan.LicenciaProfesional;
import com.trama.tpo.demo.repository.LicenciaProfesionalRepository;
import com.trama.tpo.demo.repository.SuscripcionRepository;

/**
 * Planes del profesional (9.0). Única fuente de la pregunta "¿este profesional edita sin límite?":
 * sí con una suscripción vigente (9.1) o con la licencia de una institución (9.2).
 */
@Service
public class PlanService {

    /** Proyectos que un profesional sin plan pago puede editar (los más antiguos por fecha de alta). */
    public static final int PROYECTOS_GRATUITOS = 2;

    /** Roles a los que aplica el plan: las familias y los tutores nunca tienen límite. */
    public static final Set<Rol> ROLES_PROFESIONALES = Set.of(Rol.EDUCACION, Rol.SALUD);

    private final SuscripcionRepository suscripcionRepository;
    private final LicenciaProfesionalRepository licenciaRepository;

    public PlanService(
            SuscripcionRepository suscripcionRepository,
            LicenciaProfesionalRepository licenciaRepository) {
        this.suscripcionRepository = suscripcionRepository;
        this.licenciaRepository = licenciaRepository;
    }

    public boolean editaSinLimite(UUID usuarioId) {
        LocalDate hoy = LocalDate.now();
        boolean suscripto = suscripcionRepository.findById(usuarioId)
                .map(suscripcion -> suscripcion.vigenteEn(hoy))
                .orElse(false);
        return suscripto || institucionQueLoCubre(usuarioId).isPresent();
    }

    /** 9.2: la institución cuya licencia cubre al profesional, si tiene una vigente. */
    public Optional<Institucion> institucionQueLoCubre(UUID usuarioId) {
        return licenciaRepository.vigentesDe(usuarioId, LocalDate.now()).stream()
                .map(LicenciaProfesional::getInstitucion)
                .findFirst();
    }
}
