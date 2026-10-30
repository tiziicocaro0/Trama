package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.MiPlanResponse;
import com.trama.tpo.demo.entity.dto.SuscribirseRequest;
import com.trama.tpo.demo.entity.plan.Institucion;
import com.trama.tpo.demo.entity.plan.Suscripcion;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.InstitucionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.SuscripcionRepository;

/**
 * 9.1: suscripción del profesional con pago simulado.
 * Suscribirse activa el plan sin pasarela; cancelar lo corta en el momento y el
 * profesional vuelve al límite de 2 niños (lo decide PermisoService a través de PlanService).
 */
@Service
public class SuscripcionService {

    private final SuscripcionRepository suscripcionRepository;
    private final MembresiaRepository membresiaRepository;
    private final InstitucionRepository institucionRepository;
    private final PlanService planService;
    private final UsuarioActual usuarioActual;

    public SuscripcionService(
            SuscripcionRepository suscripcionRepository,
            MembresiaRepository membresiaRepository,
            InstitucionRepository institucionRepository,
            PlanService planService,
            UsuarioActual usuarioActual) {
        this.suscripcionRepository = suscripcionRepository;
        this.membresiaRepository = membresiaRepository;
        this.institucionRepository = institucionRepository;
        this.planService = planService;
        this.usuarioActual = usuarioActual;
    }

    @Transactional(readOnly = true)
    public MiPlanResponse obtener() {
        return respuesta(usuarioActual.obtenerId());
    }

    @Transactional
    public MiPlanResponse suscribirse(SuscribirseRequest request) {
        UUID usuarioId = usuarioActual.obtenerId();
        LocalDate hoy = LocalDate.now();

        Suscripcion suscripcion = suscripcionRepository.findById(usuarioId)
                .orElseGet(() -> Suscripcion.builder().usuarioId(usuarioId).build());

        if (suscripcion.getDesde() != null && suscripcion.vigenteEn(hoy)) {
            throw new ApiException("YA_SUSCRIPTO",
                    "Ya tenés una suscripción activa. Cancelala para cambiar de plan.", HttpStatus.CONFLICT);
        }

        suscripcion.setActiva(true);
        suscripcion.setPeriodo(request.periodo());
        suscripcion.setDesde(hoy);
        suscripcion.setHasta(hoy.plusMonths(request.periodo().getMeses()));
        suscripcionRepository.save(suscripcion);

        return respuesta(usuarioId);
    }

    @Transactional
    public MiPlanResponse cancelar() {
        UUID usuarioId = usuarioActual.obtenerId();
        LocalDate hoy = LocalDate.now();

        Suscripcion suscripcion = suscripcionRepository.findById(usuarioId)
                .filter(s -> s.vigenteEn(hoy))
                .orElseThrow(() -> new ApiException("SIN_SUSCRIPCION",
                        "No tenés una suscripción activa", HttpStatus.NOT_FOUND));

        suscripcion.setActiva(false);
        suscripcion.setHasta(hoy);
        suscripcionRepository.save(suscripcion);

        return respuesta(usuarioId);
    }

    // Orden: suscripción propia vigente → licencia institucional (9.2) → plan gratuito.
    private MiPlanResponse respuesta(UUID usuarioId) {
        boolean esProfesional = membresiaRepository.existsByUsuarioIdAndRolIn(
                usuarioId, PlanService.ROLES_PROFESIONALES);
        boolean esResponsable = institucionRepository.existsByResponsableId(usuarioId);
        String institucion = planService.institucionQueLoCubre(usuarioId)
                .map(Institucion::getNombre).orElse(null);

        return suscripcionRepository.findById(usuarioId)
                .filter(s -> s.vigenteEn(LocalDate.now()))
                .map(s -> MiPlanResponse.de(esProfesional, esResponsable, s.getPeriodo().name(),
                        s.getDesde(), s.getHasta(), institucion))
                .orElseGet(() -> MiPlanResponse.de(esProfesional, esResponsable,
                        institucion != null ? "INSTITUCIONAL" : "GRATUITO", null, null, institucion));
    }
}
