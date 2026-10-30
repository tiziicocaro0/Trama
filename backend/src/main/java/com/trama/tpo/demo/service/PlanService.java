package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.trama.tpo.demo.repository.SuscripcionRepository;

/**
 * Planes del profesional (9.0). Única fuente de la pregunta "¿este profesional edita sin límite?".
 * Hoy la respuesta es sí con una suscripción vigente; la licencia institucional (9.2) se suma acá.
 */
@Service
public class PlanService {

    /** Proyectos que un profesional sin plan pago puede editar (los más antiguos por fecha de alta). */
    public static final int PROYECTOS_GRATUITOS = 2;

    private final SuscripcionRepository suscripcionRepository;

    public PlanService(SuscripcionRepository suscripcionRepository) {
        this.suscripcionRepository = suscripcionRepository;
    }

    public boolean editaSinLimite(UUID usuarioId) {
        LocalDate hoy = LocalDate.now();
        return suscripcionRepository.findById(usuarioId)
                .map(suscripcion -> suscripcion.vigenteEn(hoy))
                .orElse(false);
    }
}
