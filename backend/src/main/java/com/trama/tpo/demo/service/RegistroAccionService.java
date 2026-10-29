package com.trama.tpo.demo.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.registro.RegistroAccion;
import com.trama.tpo.demo.repository.RegistroAccionRepository;

/**
 * Registra quién hizo qué, sobre qué sección y cuándo (0.2).
 * Lo llaman los demás services, dentro de su transacción: si la acción falla,
 * el registro tampoco queda, y si el registro falla, la acción no se guarda.
 */
@Service
public class RegistroAccionService {

    private final RegistroAccionRepository registroAccionRepository;

    public RegistroAccionService(RegistroAccionRepository registroAccionRepository) {
        this.registroAccionRepository = registroAccionRepository;
    }

    // seccion: el tipo de aporte (FORTALEZA, INTERES…) o MIEMBROS. Nunca títulos ni contenido.
    @Transactional(propagation = Propagation.MANDATORY)
    public void registrar(UUID usuarioId, UUID proyectoId, AccionRegistro accion, String seccion) {

        registroAccionRepository.save(RegistroAccion.builder()
                .usuarioId(usuarioId)
                .proyectoId(proyectoId)
                .accion(accion)
                .seccion(seccion)
                .build());
    }
}
