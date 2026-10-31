package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.InvitacionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/** 1.3: el tutor administrador ve las invitaciones pendientes con su vencimiento y puede cancelarlas. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InvitacionesPendientesTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private InvitacionRepository invitacionRepository;

    private Usuario tutorAdmin;
    private Usuario familiar;
    private Proyecto proyecto;
    private Proyecto otroProyecto;

    @BeforeEach
    void prepararDatos() {
        tutorAdmin = crearUsuario("Tutor");
        familiar = crearUsuario("Familiar");
        proyecto = crearProyecto();
        otroProyecto = crearProyecto();
        crearMembresia(tutorAdmin, proyecto, Rol.TUTOR, true);
        crearMembresia(familiar, proyecto, Rol.FAMILIAR, false);
        crearMembresia(tutorAdmin, otroProyecto, Rol.TUTOR, true);
    }

    @AfterEach
    void limpiarDatos() {
        for (Proyecto p : List.of(proyecto, otroProyecto)) {
            for (EstadoInvitacion estado : EstadoInvitacion.values()) {
                invitacionRepository.deleteAll(
                        invitacionRepository.findByProyectoIdAndEstado(p.getId(), estado));
            }
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(p.getId()));
        }
        invitacionRepository.flush();
        membresiaRepository.flush();
        proyectoRepository.deleteAll(List.of(proyecto, otroProyecto));
        usuarioRepository.deleteAll(List.of(tutorAdmin, familiar));
    }

    @Test
    void elAdminVeSoloLasPendientesVigentesOrdenadasPorVencimiento() throws Exception {
        Invitacion vencePronto = crearInvitacion(proyecto, "pronto@example.com",
                EstadoInvitacion.PENDIENTE, Instant.now().plus(1, ChronoUnit.DAYS));
        crearInvitacion(proyecto, "despues@example.com",
                EstadoInvitacion.PENDIENTE, Instant.now().plus(6, ChronoUnit.DAYS));
        crearInvitacion(proyecto, "vencida@example.com",
                EstadoInvitacion.PENDIENTE, Instant.now().minus(1, ChronoUnit.DAYS));
        crearInvitacion(proyecto, "cancelada@example.com",
                EstadoInvitacion.CANCELADA, Instant.now().plus(3, ChronoUnit.DAYS));
        crearInvitacion(otroProyecto, "otro@example.com",
                EstadoInvitacion.PENDIENTE, Instant.now().plus(3, ChronoUnit.DAYS));

        mockMvc.perform(get(ruta(proyecto)).header("Authorization", token(tutorAdmin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(vencePronto.getId().toString()))
                .andExpect(jsonPath("$[0].email").value("pronto@example.com"))
                .andExpect(jsonPath("$[0].rol").value("EDUCACION"))
                .andExpect(jsonPath("$[0].estado").value("PENDIENTE"))
                .andExpect(jsonPath("$[0].venceEn").exists())
                .andExpect(jsonPath("$[1].email").value("despues@example.com"));
    }

    @Test
    void unMiembroQueNoEsAdminNoVeLasInvitaciones() throws Exception {
        mockMvc.perform(get(ruta(proyecto)).header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
    }

    @Test
    void elAdminCancelaUnaInvitacionYDejaDeAparecer() throws Exception {
        Invitacion invitacion = crearInvitacion(proyecto, "cancelar@example.com",
                EstadoInvitacion.PENDIENTE, Instant.now().plus(7, ChronoUnit.DAYS));

        mockMvc.perform(delete(ruta(proyecto) + "/" + invitacion.getId())
                        .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isNoContent());

        assertEquals(EstadoInvitacion.CANCELADA,
                invitacionRepository.findById(invitacion.getId()).orElseThrow().getEstado());

        mockMvc.perform(get(ruta(proyecto)).header("Authorization", token(tutorAdmin)))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void unMiembroQueNoEsAdminNoPuedeCancelar() throws Exception {
        Invitacion invitacion = crearInvitacion(proyecto, "x@example.com",
                EstadoInvitacion.PENDIENTE, Instant.now().plus(7, ChronoUnit.DAYS));

        mockMvc.perform(delete(ruta(proyecto) + "/" + invitacion.getId())
                        .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());

        assertEquals(EstadoInvitacion.PENDIENTE,
                invitacionRepository.findById(invitacion.getId()).orElseThrow().getEstado());
    }

    @Test
    void noSeCancelaUnaInvitacionDeOtroProyecto() throws Exception {
        Invitacion deOtro = crearInvitacion(otroProyecto, "otro@example.com",
                EstadoInvitacion.PENDIENTE, Instant.now().plus(7, ChronoUnit.DAYS));

        mockMvc.perform(delete(ruta(proyecto) + "/" + deOtro.getId())
                        .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("INVITACION_NO_ENCONTRADA"));
    }

    @Test
    void noSeCancelaUnaInvitacionYaAceptada() throws Exception {
        Invitacion aceptada = crearInvitacion(proyecto, "acepto@example.com",
                EstadoInvitacion.ACEPTADA, Instant.now().plus(7, ChronoUnit.DAYS));

        mockMvc.perform(delete(ruta(proyecto) + "/" + aceptada.getId())
                        .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("INVITACION_NO_PENDIENTE"));
    }

    private String ruta(Proyecto p) {
        return "/api/proyectos/" + p.getId() + "/invitaciones";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Proyecto crearProyecto() {
        return proyectoRepository.save(Proyecto.builder()
                .nombre("Proyecto")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3")
                .consentimientoFecha(Instant.now())
                .build());
    }

    private void crearMembresia(Usuario usuario, Proyecto p, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(p)
                .rol(rol)
                .esAdmin(esAdmin)
                .build());
    }

    private Invitacion crearInvitacion(Proyecto p, String email, EstadoInvitacion estado, Instant venceEn) {
        return invitacionRepository.save(Invitacion.builder()
                .proyecto(p)
                .invitadoPor(tutorAdmin)
                .email(email)
                .rol(Rol.EDUCACION)
                .tokenHash(UUID.randomUUID().toString().replace("-", "")
                        + UUID.randomUUID().toString().replace("-", ""))
                .venceEn(venceEn)
                .estado(estado)
                .build());
    }
}
