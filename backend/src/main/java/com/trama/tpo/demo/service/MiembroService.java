
package com.trama.tpo.demo.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.repository.MembresiaRepository;

@Service
public class MiembroService {

    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;

    public MiembroService(
            MembresiaRepository membresiaRepository,
            PermisoService permisoService) {

        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
    }

    // 1.3 - LISTAR LOS INTEGRANTES DE UN PROYECTO
    @Transactional(readOnly = true)
    public List<MiembroResponse> listarMiembros(UUID proyectoId) {

        // Solo un integrante del proyecto puede consultar la lista.
        permisoService.verificarMiembro(proyectoId);

        // Buscar las membresias y convertirlas en DTO.
        return membresiaRepository.findByProyectoId(proyectoId)
                .stream()
                .map(MiembroResponse::from)
                .toList();
    }
}
