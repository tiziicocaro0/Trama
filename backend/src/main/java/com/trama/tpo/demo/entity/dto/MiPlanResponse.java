package com.trama.tpo.demo.entity.dto;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import com.trama.tpo.demo.entity.plan.PeriodoSuscripcion;
import com.trama.tpo.demo.service.PlanService;

/**
 * 9.1: el plan del usuario para la página /cuenta/plan.
 * plan = GRATUITO, MENSUAL, SEMESTRAL o INSTITUCIONAL (9.2). Las familias reciben
 * esProfesional = false y el front no les muestra precios ni pantallas de pago.
 * institucion = nombre de la institución cuya licencia cubre al profesional (o null).
 */
public record MiPlanResponse(
        boolean esProfesional,
        boolean esResponsable,
        String plan,
        LocalDate desde,
        LocalDate hasta,
        String institucion,
        int proyectosGratuitos,
        List<PrecioPlan> planes) {

    public record PrecioPlan(PeriodoSuscripcion periodo, int meses, int precioArs) {
    }

    public static MiPlanResponse de(boolean esProfesional, boolean esResponsable, String plan,
            LocalDate desde, LocalDate hasta, String institucion) {
        List<PrecioPlan> planes = Arrays.stream(PeriodoSuscripcion.values())
                .map(p -> new PrecioPlan(p, p.getMeses(), p.getPrecioArs()))
                .toList();
        return new MiPlanResponse(esProfesional, esResponsable, plan, desde, hasta, institucion,
                PlanService.PROYECTOS_GRATUITOS, planes);
    }
}
