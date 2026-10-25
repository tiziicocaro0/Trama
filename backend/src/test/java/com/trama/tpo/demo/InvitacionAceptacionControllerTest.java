
package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
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
import com.trama.tpo.demo.service.EmailService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties =
        "trama.invitaciones.url-base=https://trama.example/invitacion")
class InvitacionAceptacionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProyectoRepository proyectoRepository;

    @Autowired
    private MembresiaRepository membresiaRepository;

    @Autowired
    private InvitacionRepository invitacionRepository;

    @MockBean
    private EmailService emailService;

    private Usuario tutor;
    private Usuario destinatario;
    private Usuario otroUsuario;
    private Proyecto proyecto;
    private Invitacion invitacionCreada;

    @BeforeEach
    void prepararDatos() {

        tutor = usuarioRepository.save(Usuario.builder()
                .nombre("Laura")
                .apellido("Prueba")
                .email("tutor." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());

        destinatario = usuarioRepository.save(Usuario.builder()
                .nombre("Maria")
                .apellido("Prueba")
                .email("docente." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());

        otroUsuario = usuarioRepository.save(Usuario.builder()
                .nombre("Otra")
                .apellido("Persona")
                .email("otro." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Mateo")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3")
                .consentimientoFecha(Instant.now())
                .build());

        membresiaRepository.saveAndFlush(Membresia.builder()
                .usuario(tutor)
                .proyecto(proyecto)
                .rol(Rol.TUTOR)
                .esAdmin(true)
                .build());
    }

    // Guarda una invitacion y devuelve su token original.
    private String registrarInvitacion(
            EstadoInvitacion estado,
            Instant vencimiento) throws Exception {

        String token = "token-" + UUID.randomUUID();

        byte[] hash = MessageDigest.getInstance("SHA-256")
                .digest(token.getBytes(StandardCharsets.UTF_8));

        invitacionCreada = invitacionRepository.saveAndFlush(
                Invitacion.builder()
                        .proyecto(proyecto)
                        .invitadoPor(tutor)
                        .email(destinatario.getEmail())
                        .rol(Rol.EDUCACION)
                        .tokenHash(HexFormat.of().formatHex(hash))
                        .venceEn(vencimiento)
                        .estado(estado)
                        .build()
        );

        return token;
    }

    private String tokenJwt(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }

    @AfterEach
    void limpiarDatos() {

        // Eliminar la invitacion sin importar si quedo PENDIENTE o ACEPTADA.
        if (invitacionCreada != null) {
            invitacionRepository.deleteById(invitacionCreada.getId());
            invitacionRepository.flush();
        }

        // Eliminar tanto la membresia del tutor como la que pueda crear el POST.
        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId())
        );
        membresiaRepository.flush();

        proyectoRepository.delete(proyecto);

        usuarioRepository.deleteAll(
                List.of(tutor, destinatario, otroUsuario)
        );
    }

    // TEST 1: el GET debe funcionar sin iniciar sesion.
    @Test
    void consultarInvitacionSinSesionDevuelve200() throws Exception {

        String token = registrarInvitacion(
                EstadoInvitacion.PENDIENTE,
                Instant.now().plus(1, ChronoUnit.DAYS)
        );

        mockMvc.perform(get("/api/invitaciones/{token}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreProyecto").value("Mateo"))
                .andExpect(jsonPath("$.nombreInvitador").value("Laura"))
                .andExpect(jsonPath("$.rol").value("EDUCACION"))
                .andExpect(jsonPath("$.venceEn").exists())
                .andExpect(jsonPath("$.tokenHash").doesNotExist())
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    // TEST 2: el destinatario acepta y se crea su membresia.
    @Test
    void aceptarInvitacionValidaDevuelve201() throws Exception {

        String token = registrarInvitacion(
                EstadoInvitacion.PENDIENTE,
                Instant.now().plus(1, ChronoUnit.DAYS)
        );

        mockMvc.perform(post("/api/invitaciones/{token}/aceptar", token)
                        .header("Authorization", tokenJwt(destinatario)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuarioId")
                        .value(destinatario.getId().toString()))
                .andExpect(jsonPath("$.rol").value("EDUCACION"))
                .andExpect(jsonPath("$.esAdmin").value(false));

        Membresia membresia = membresiaRepository
                .findByUsuarioIdAndProyectoId(
                        destinatario.getId(),
                        proyecto.getId()
                )
                .orElseThrow();

        assertEquals(Rol.EDUCACION, membresia.getRol());
        assertFalse(membresia.getEsAdmin());

        Invitacion actualizada = invitacionRepository
                .findById(invitacionCreada.getId())
                .orElseThrow();

        assertEquals(EstadoInvitacion.ACEPTADA, actualizada.getEstado());
    }

    // TEST 3: sin iniciar sesion no puede aceptarse la invitacion.
    @Test
    void aceptarSinSesionDevuelve401() throws Exception {

        String token = registrarInvitacion(
                EstadoInvitacion.PENDIENTE,
                Instant.now().plus(1, ChronoUnit.DAYS)
        );

        mockMvc.perform(post("/api/invitaciones/{token}/aceptar", token))
                .andExpect(status().isUnauthorized());

        assertFalse(membresiaRepository.existsByUsuarioIdAndProyectoId(
                destinatario.getId(), proyecto.getId()));

        assertEquals(
                EstadoInvitacion.PENDIENTE,
                invitacionRepository.findById(invitacionCreada.getId())
                        .orElseThrow().getEstado()
        );
    }

    // TEST 4: otra cuenta no puede utilizar una invitacion ajena.
    @Test
    void otroUsuarioNoPuedeAceptarInvitacion() throws Exception {

        String token = registrarInvitacion(
                EstadoInvitacion.PENDIENTE,
                Instant.now().plus(1, ChronoUnit.DAYS)
        );

        mockMvc.perform(post("/api/invitaciones/{token}/aceptar", token)
                        .header("Authorization", tokenJwt(otroUsuario)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("DESTINATARIO_INCORRECTO"));

        assertFalse(membresiaRepository.existsByUsuarioIdAndProyectoId(
                otroUsuario.getId(), proyecto.getId()));

        assertEquals(
                EstadoInvitacion.PENDIENTE,
                invitacionRepository.findById(invitacionCreada.getId())
                        .orElseThrow().getEstado()
        );
    }

    // TEST 5: una invitacion vencida devuelve 410.
    @Test
    void invitacionVencidaDevuelve410() throws Exception {

        String token = registrarInvitacion(
                EstadoInvitacion.PENDIENTE,
                Instant.now().minus(1, ChronoUnit.DAYS)
        );

        mockMvc.perform(get("/api/invitaciones/{token}", token))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.codigo")
                        .value("INVITACION_NO_DISPONIBLE"));

        mockMvc.perform(post("/api/invitaciones/{token}/aceptar", token)
                        .header("Authorization", tokenJwt(destinatario)))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.codigo")
                        .value("INVITACION_NO_DISPONIBLE"));

        assertFalse(membresiaRepository.existsByUsuarioIdAndProyectoId(
                destinatario.getId(), proyecto.getId()));
    }

    // TEST 6: una invitacion ya utilizada devuelve 410.
    @Test
    void invitacionUtilizadaDevuelve410() throws Exception {

        String token = registrarInvitacion(
                EstadoInvitacion.ACEPTADA,
                Instant.now().plus(1, ChronoUnit.DAYS)
        );

        mockMvc.perform(get("/api/invitaciones/{token}", token))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.codigo")
                        .value("INVITACION_NO_DISPONIBLE"));

        mockMvc.perform(post("/api/invitaciones/{token}/aceptar", token)
                        .header("Authorization", tokenJwt(destinatario)))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.codigo")
                        .value("INVITACION_NO_DISPONIBLE"));

        assertFalse(membresiaRepository.existsByUsuarioIdAndProyectoId(
                destinatario.getId(), proyecto.getId()));
    }
}
