package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.service.PermisoService;

// 3.1: una sola regla de visibilidad por rol, para el chequeo de un aporte y para el listado.
class VisibilidadesPermitidasTest {

    @Test
    void tutorVeTodasLasVisibilidades() {
        assertEquals(List.of(Visibilidad.values()),
                PermisoService.visibilidadesPermitidas(Rol.TUTOR));
    }

    @Test
    void saludVeTodosYSoloSalud() {
        assertEquals(List.of(Visibilidad.TODOS, Visibilidad.SOLO_SALUD),
                PermisoService.visibilidadesPermitidas(Rol.SALUD));
    }

    @Test
    void educacionVeTodosYSoloEducacion() {
        assertEquals(List.of(Visibilidad.TODOS, Visibilidad.SOLO_EDUCACION),
                PermisoService.visibilidadesPermitidas(Rol.EDUCACION));
    }

    @Test
    void familiarSoloVeTodos() {
        assertEquals(List.of(Visibilidad.TODOS),
                PermisoService.visibilidadesPermitidas(Rol.FAMILIAR));
    }
}
