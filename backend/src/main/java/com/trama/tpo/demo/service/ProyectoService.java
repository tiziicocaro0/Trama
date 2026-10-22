package com.trama.tpo.demo.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.ConfiguracionProyectoRequest;
import com.trama.tpo.demo.entity.dto.MiProyectoDTO;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;

@Service
public class ProyectoService {

    private static final List<Membresia> MIEMBROS_MOCK = List.of(
            Membresia.builder()
                    .id(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"))
                    .rol(Rol.TUTOR)
                    .esAdmin(true)
                    .build(),
            Membresia.builder()
                    .id(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"))
                    .rol(Rol.EDUCACION)
                    .esAdmin(false)
                    .build(),
            Membresia.builder()
                    .id(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"))
                    .rol(Rol.SALUD)
                    .esAdmin(false)
                    .build(),
            Membresia.builder()
                    .id(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"))
                    .rol(Rol.FAMILIAR)
                    .esAdmin(false)
                    .build()
    );

    private final ProyectoRepository proyectoRepository;
    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;

    public ProyectoService(
            ProyectoRepository proyectoRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual) {

        this.proyectoRepository = proyectoRepository;
        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
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

    // 1.3 / 1.5 Quitar acceso a un miembro: solo un tutor administrador, sin eliminar al único admin
    @Transactional
    public void quitarMiembro(UUID proyectoId, UUID miembroId) {

        permisoService.verificarAdmin(proyectoId);

        List<Membresia> miembros = membresiaRepository.findByProyectoId(proyectoId);
        boolean usaDatosMock = miembros.isEmpty();
        if (usaDatosMock) {
            miembros = MIEMBROS_MOCK;
        }

        Membresia objetivo = miembros.stream()
                .filter(m -> miembroId.equals(m.getId())
                        || (m.getUsuario() != null && miembroId.equals(m.getUsuario().getId())))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        "MIEMBRO_NO_ENCONTRADO",
                        "No encontramos a este miembro en el proyecto",
                        HttpStatus.NOT_FOUND
                ));

        if (objetivo.getRol() == Rol.TUTOR && Boolean.TRUE.equals(objetivo.getEsAdmin())) {
            long cantidadAdmins = miembros.stream()
                    .filter(m -> m.getRol() == Rol.TUTOR && Boolean.TRUE.equals(m.getEsAdmin()))
                    .count();

            if (cantidadAdmins <= 1) {
                throw new ApiException(
                        "ULTIMO_ADMIN",
                        "No podés quitar el acceso al único administrador del proyecto",
                        HttpStatus.BAD_REQUEST
                );
            }
        }

        if (!usaDatosMock) {
            membresiaRepository.delete(objetivo);
        }
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
