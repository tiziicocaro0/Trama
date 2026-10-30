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
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;

@Service
public class MiembroService {

    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public MiembroService(
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {

        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
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
        Membresia membresia = buscarMiembro(
                membresiaRepository.findByProyectoId(proyectoId),
                miembroId
        );

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

    // 1.5 - QUITAR EL ACCESO A UN MIEMBRO (sin dejar al proyecto sin administrador)
    @Transactional
    public void quitarMiembro(UUID proyectoId, UUID miembroId) {

        // 1. Solo un tutor administrador puede quitar accesos.
        permisoService.verificarAdmin(proyectoId);

        List<Membresia> miembros = membresiaRepository.findByProyectoId(proyectoId);

        // 2. Buscar la membresia en el proyecto (por id de membresia o id de usuario).
        Membresia objetivo = buscarMiembro(miembros, miembroId);

        // 3. No se puede quitar al único administrador.
        if (esAdministrador(objetivo)) {
            long cantidadAdmins = miembros.stream()
                    .filter(MiembroService::esAdministrador)
                    .count();

            if (cantidadAdmins <= 1) {
                throw new ApiException(
                        "ULTIMO_ADMIN",
                        "No podés quitar el acceso al único administrador del proyecto",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        // 4. Se borra la membresia; sus aportes quedan en el proyecto con su nombre.
        membresiaRepository.delete(objetivo);

        // 0.2: auditoría
        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.REVOCAR, "MIEMBROS");
    }

    // Busca un miembro del proyecto por id de membresia o por id de usuario.
    private Membresia buscarMiembro(List<Membresia> miembros, UUID miembroId) {

        return miembros.stream()
                .filter(m -> miembroId.equals(m.getId())
                        || (m.getUsuario() != null && miembroId.equals(m.getUsuario().getId())))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        "MIEMBRO_NO_ENCONTRADO",
                        "No encontramos a este miembro en el proyecto",
                        HttpStatus.NOT_FOUND
                ));
    }

    private static boolean esAdministrador(Membresia membresia) {
        return membresia.getRol() == Rol.TUTOR && Boolean.TRUE.equals(membresia.getEsAdmin());
    }
}
