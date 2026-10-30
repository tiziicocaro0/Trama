package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.MiPlanResponse;
import com.trama.tpo.demo.entity.dto.SuscribirseRequest;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.plan.Suscripcion;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.SuscripcionRepository;

/**
 * 9.1: suscripción del profesional con pago simulado.
 * Suscribirse activa el plan sin pasarela; cancelar lo corta en el momento y el
 * profesional vuelve al límite de 2 niños (lo decide PermisoService a través de PlanService).
 */
@Service
public class SuscripcionService {

    private static final Set<Rol> ROLES_PROFESIONALES = Set.of(Rol.EDUCACION, Rol.SALUD);

    private final SuscripcionRepository suscripcionRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioActual usuarioActual;

    public SuscripcionService(
            SuscripcionRepository suscripcionRepository,
            MembresiaRepository membresiaRepository,
            UsuarioActual usuarioActual) {
        this.suscripcionRepository = suscripcionRepository;
        this.membresiaRepository = membresiaRepository;
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

    private MiPlanResponse respuesta(UUID usuarioId) {
        boolean esProfesional = membresiaRepository.existsByUsuarioIdAndRolIn(usuarioId, ROLES_PROFESIONALES);
        return suscripcionRepository.findById(usuarioId)
                .filter(s -> s.vigenteEn(LocalDate.now()))
                .map(s -> MiPlanResponse.de(esProfesional, s.getPeriodo().name(), s.getDesde(), s.getHasta()))
                .orElseGet(() -> MiPlanResponse.de(esProfesional, "GRATUITO", null, null));
    }
}
