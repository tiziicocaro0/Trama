package com.trama.tpo.demo.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.exceptions.ApiException;
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
        return membresiaRepository
                .findByProyectoIdOrderByUsuarioNombreAscUsuarioApellidoAsc(proyectoId)
                .stream()
                .map(MiembroResponse::from)
                .toList();
    }

    // 1.6 - CONVERTIR UN FAMILIAR EN CO-TUTOR ADMINISTRADOR
    @Transactional
    public MiembroResponse hacerCoTutor(UUID proyectoId, UUID miembroId) {

        // 1. Solo un tutor administrador puede designar co-tutores.
        permisoService.verificarAdmin(proyectoId);

        // 2. Buscar la membresia en el proyecto (por id de membresia o id de usuario).
        Membresia membresia = membresiaRepository.findByProyectoId(proyectoId)
                .stream()
                .filter(m -> miembroId.equals(m.getId())
                        || (m.getUsuario() != null && miembroId.equals(m.getUsuario().getId())))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        "MIEMBRO_NO_ENCONTRADO",
                        "No encontramos a este miembro en el proyecto",
                        HttpStatus.NOT_FOUND
                ));

        // 3. Solo un miembro con rol FAMILIAR puede convertirse en co-tutor.
        if (membresia.getRol() != Rol.FAMILIAR) {
            throw new ApiException(
                    "ROL_NO_CONVERTIBLE",
                    "Solo un familiar puede convertirse en co-tutor",
                    HttpStatus.BAD_REQUEST
            );
        }

        // 4. Actualizar a TUTOR administrador.
        membresia.setRol(Rol.TUTOR);
        membresia.setEsAdmin(true);

        membresia = membresiaRepository.saveAndFlush(membresia);

        return MiembroResponse.from(membresia);
    }
}
