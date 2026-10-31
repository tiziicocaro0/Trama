package com.trama.tpo.demo.entity.plan;

/**
 * 9.1: planes de la suscripción del profesional. Los precios (en pesos) salen de la
 * planilla de costos (0.13) y el front los muestra desde la API, sin repetirlos.
 */
public enum PeriodoSuscripcion {

    MENSUAL(1, 4500),
    SEMESTRAL(6, 24000);

    private final int meses;
    private final int precioArs;

    PeriodoSuscripcion(int meses, int precioArs) {
        this.meses = meses;
        this.precioArs = precioArs;
    }

    public int getMeses() {
        return meses;
    }

    public int getPrecioArs() {
        return precioArs;
    }
}
