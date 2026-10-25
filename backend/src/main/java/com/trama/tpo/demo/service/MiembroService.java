
package com.trama.tpo.demo.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.EspecialidadItemRequest;
import com.trama.tpo.demo.entity.dto.EspecialidadRequest;
import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.MembresiaEspecialidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;

@Service
public class MiembroService {

    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;

    public MiembroService(
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual) {

        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
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

    // 1.9 - CAMBIAR ESPECIALIDADES DE MI MEMBRESÍA
    @Transactional
    public MiembroResponse cambiarEspecialidades(
            UUID proyectoId,
            EspecialidadRequest request) {

        // 1. Solo un miembro del proyecto puede modificar sus propias especialidades.
        permisoService.verificarMiembro(proyectoId);

        UUID usuarioId = usuarioActual.obtenerId();

        // 2. Buscar la membresía del usuario autenticado en este proyecto.
        Membresia membresia = membresiaRepository
                .findByUsuarioIdAndProyectoId(usuarioId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "MEMBRESIA_NO_ENCONTRADA",
                        "No encontramos tu membresía en este proyecto",
                        HttpStatus.NOT_FOUND
                ));

        // 3. Solo los roles EDUCACION y SALUD pueden declarar especialidades.
        Rol rol = membresia.getRol();

        if (rol != Rol.EDUCACION && rol != Rol.SALUD) {
            throw new ApiException(
                    "ROL_SIN_ESPECIALIDAD",
                    "Solo los profesionales de educación o salud pueden declarar especialidades",
                    HttpStatus.BAD_REQUEST
            );
        }

        // 4. Validar que cada especialidad pertenece al rol del miembro.
        for (EspecialidadItemRequest item : request.especialidades()) {

            if (item.especialidad().getRol() != rol) {
                throw new ApiException(
                        "ESPECIALIDAD_INCOMPATIBLE",
                        "La especialidad " + item.especialidad().name()
                                + " no corresponde al rol " + rol.name(),
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // 5. Reemplazar las especialidades existentes.
        membresia.getEspecialidades().clear();

        for (EspecialidadItemRequest item : request.especialidades()) {

            MembresiaEspecialidad nueva = MembresiaEspecialidad.builder()
                    .membresia(membresia)
                    .especialidad(item.especialidad())
                    .aclaracion(item.aclaracion())
                    .build();

            membresia.getEspecialidades().add(nueva);
        }

        membresia = membresiaRepository.saveAndFlush(membresia);

        return MiembroResponse.from(membresia);
    }
}
