package com.trama.tpo.demo.service;

import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.time.Instant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.ConfiguracionProyectoRequest;
import com.trama.tpo.demo.entity.dto.CrearProyectoRequest;
import com.trama.tpo.demo.entity.dto.MiProyectoDTO;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.dto.ProfesionalRedResponse;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@Service
public class ProyectoService {

    private final ProyectoRepository proyectoRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioRepository usuarioRepository;

    public ProyectoService(
            ProyectoRepository proyectoRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            MembresiaRepository membresiaRepository,
            UsuarioRepository usuarioRepository) {

        this.proyectoRepository = proyectoRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.membresiaRepository = membresiaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public ProyectoResponse crear(CrearProyectoRequest request) {
        UUID usuarioId = permisoService.verificarPuedeCrearProyecto();
        if (!Boolean.TRUE.equals(request.consentimiento())) {
            throw new ApiException("CONSENTIMIENTO_REQUERIDO",
                    "Necesitamos tu autorización para crear el acompañamiento", HttpStatus.BAD_REQUEST);
        }
        var usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException("USUARIO_NO_ENCONTRADO",
                        "Usuario no encontrado", HttpStatus.NOT_FOUND));

        Proyecto proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre(request.nombre())
                .apellido(request.apellido())
                .apodo(request.apodo())
                .fechaNacimiento(request.fechaNacimiento())
                .escuela(request.escuela())
                .grado(request.grado())
                .consentimientoFecha(Instant.now())
                .build());

        membresiaRepository.save(Membresia.builder()
                .proyecto(proyecto)
                .usuario(usuario)
                .rol(Rol.TUTOR)
                .esAdmin(true)
                .build());
        return ProyectoResponse.from(proyecto);
    }

    // 1.10 Mis proyectos: solo los niños donde el usuario logueado es miembro
    @Transactional(readOnly = true)
    public List<MiProyectoDTO> listarMisProyectos() {

        return proyectoRepository.findMisProyectos(usuarioActual.obtenerId());
    }

    // Ver los datos de un niño: solo sus miembros
    @Transactional(readOnly = true)
    public ProyectoResponse obtener(UUID proyectoId) {

        permisoService.verificarMiembro(proyectoId);

        return ProyectoResponse.from(buscarProyecto(proyectoId));
    }

    @Transactional(readOnly = true)
    public List<ProfesionalRedResponse> listarRed(UUID proyectoId) {
        permisoService.verificarMiembro(proyectoId);
        return membresiaRepository.findProfesionalesRed(proyectoId, Set.of(Rol.EDUCACION, Rol.SALUD));
    }

    // Cambiar qué puede hacer la familia: solo el tutor administrador
    @Transactional
    public ProyectoResponse actualizarConfiguracion(
            UUID proyectoId,
            ConfiguracionProyectoRequest request) {

        permisoService.verificarAdmin(proyectoId);

        Proyecto proyecto = buscarProyecto(proyectoId);

        proyecto.setFamiliarPuedeCargar(request.familiarPuedeCargar());
        proyecto.setFamiliarVeNotas(request.familiarVeNotas());

        return ProyectoResponse.from(proyectoRepository.save(proyecto));
    }

    private Proyecto buscarProyecto(UUID proyectoId) {

        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO",
                        "No encontramos este proyecto",
                        HttpStatus.NOT_FOUND
                ));
    }
}
