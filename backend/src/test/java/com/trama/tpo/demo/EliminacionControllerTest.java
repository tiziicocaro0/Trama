package com.trama.tpo.demo;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.NotificacionRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EliminacionControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private NotificacionRepository notificacionRepository;

    private Usuario tutorAdmin;
    private Usuario cotutor;
    private Usuario familiar;
    private Usuario ajeno;
    private Proyecto proyecto;

    private String endpoint;

    @BeforeEach
    void prepararDatos() {
        tutorAdmin = crearUsuario("Tutora");
        cotutor = crearUsuario("Cotutor");
        familiar = crearUsuario("Familiar");
        ajeno = crearUsuario("Ajeno");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Tomas")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3 grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutorAdmin, Rol.TUTOR, true);
        crearMembresia(cotutor, Rol.TUTOR, false);
        crearMembresia(familiar, Rol.FAMILIAR, false);

        endpoint = "/api/proyectos/" + proyecto.getId()
                + "/eliminacion";
    }

    @AfterEach
    void limpiarDatos() {
        for (Usuario usuario : List.of(
                tutorAdmin, cotutor, familiar, ajeno)) {

            notificacionRepository.deleteAll(
                    notificacionRepository
                            .findByUsuarioIdOrderByFechaDesc(
                                    usuario.getId(),
                                    PageRequest.of(0, 100)));
        }

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));

        proyectoRepository.deleteById(proyecto.getId());

        usuarioRepository.deleteAll(
                List.of(tutorAdmin, cotutor, familiar, ajeno));
    }

    @Test
    void tutorAdminPuedeSolicitarEliminacion() throws Exception {
        Instant antes = Instant.now();

        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eliminacionProgramada").exists());

        Proyecto actualizado = proyectoRepository
                .findById(proyecto.getId()).orElseThrow();

        assertNotNull(actualizado.getEliminacionProgramada());
        assertEquals(tutorAdmin.getId(),
                actualizado.getEliminacionPedidaPor().getId());

        long segundos = Duration.between(
                antes.plus(Duration.ofDays(7)),
                actualizado.getEliminacionProgramada()
        ).abs().getSeconds();

        assertTrue(segundos < 10,
                "La fecha debe ser aproximadamente 7 días después");
    }

    @Test
    void cotutorNoPuedeSolicitarEliminacion() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(cotutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isForbidden());
    }

    @Test
    void familiarNoPuedeSolicitarEliminacion() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(familiar))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isForbidden());
    }

    @Test
    void ajenoNoPuedeSolicitarEliminacion() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(ajeno))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isForbidden());
    }

    @Test
    void nombreIncorrectoDevuelve400() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Otro")))
                .andExpect(status().isBadRequest());

        assertNull(proyectoRepository.findById(proyecto.getId())
                .orElseThrow().getEliminacionProgramada());
    }

    @Test
    void nombreVacioDevuelve400() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void noPermiteSolicitarDosVeces() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isOk());

        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isConflict());
    }

    @Test
    void tutorAdminPuedeCancelarEliminacion() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isOk());

        mockMvc.perform(delete(endpoint)
                .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isOk());

        Proyecto actualizado = proyectoRepository
                .findById(proyecto.getId()).orElseThrow();

        assertNull(actualizado.getEliminacionProgramada());
        assertNull(actualizado.getEliminacionPedidaPor());
    }

    @Test
    void cotutorNoPuedeCancelarEliminacion() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isOk());

        mockMvc.perform(delete(endpoint)
                .header("Authorization", token(cotutor)))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancelarSinSolicitudDevuelve409() throws Exception {
        mockMvc.perform(delete(endpoint)
                .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isConflict());
    }

        @Test
        void todaLaRedRecibeNotificacion() throws Exception {
        mockMvc.perform(post(endpoint)
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isOk());

        // El cotutor y el familiar reciben una notificación
        for (Usuario usuario : List.of(cotutor, familiar)) {
                assertEquals(1,
                        notificacionRepository.countByUsuarioIdAndLeidaFalse(
                                usuario.getId()));
        }

        // El tutor administrador no recibe su propia notificación
        assertEquals(0,
                notificacionRepository.countByUsuarioIdAndLeidaFalse(
                        tutorAdmin.getId()));

        // Un usuario ajeno tampoco recibe notificaciones
        assertEquals(0,
                notificacionRepository.countByUsuarioIdAndLeidaFalse(
                        ajeno.getId()));
        }

    @Test
    void sinTokenDevuelve401() throws Exception {
        mockMvc.perform(post(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .content(nombre("Tomas")))
                .andExpect(status().isUnauthorized());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "."
                        + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(
            Usuario usuario, Rol rol, boolean admin) {

        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(admin)
                .build());
    }

    private String token(Usuario usuario) {
        return "Bearer " +
                jwtService.generateToken(usuario.getId());
    }

    private String nombre(String valor) {
        return "{\"nombreConfirmacion\":\"" + valor + "\"}";
    }
}