
package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
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
class InvitacionControllerTest {

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

    // Simula el envio: no utiliza Mailpit ni envia emails reales.
    @MockBean
    private EmailService emailService;

    private Usuario tutorAdmin;
    private Usuario familiar;
    private Proyecto proyecto;

    @BeforeEach
void prepararDatos() {
    // 1. Crear al tutor administrador.
    tutorAdmin = usuarioRepository.save(Usuario.builder()
            .nombre("Tutor")
            .apellido("Prueba")
            .email("tutor." + UUID.randomUUID() + "@example.com")
            .passwordHash("no-se-usa-en-estos-tests")
            .build());

    // 2. Crear al familiar.
    familiar = usuarioRepository.save(Usuario.builder()
            .nombre("Familiar")
            .apellido("Prueba")
            .email("familiar." + UUID.randomUUID() + "@example.com")
            .passwordHash("no-se-usa-en-estos-tests")
            .build());

    // 3. Crear el proyecto ANTES de las membresias.
    proyecto = proyectoRepository.save(Proyecto.builder()
            .nombre("Proyecto")
            .apellido("Prueba")
            .fechaNacimiento(LocalDate.of(2017, 1, 1))
            .escuela("Escuela de prueba")
            .grado("3")
            .consentimientoFecha(Instant.now())
            .build());

    // 4. Asociar al tutor administrador con el proyecto.
    membresiaRepository.save(Membresia.builder()
            .usuario(tutorAdmin)
            .proyecto(proyecto)
            .rol(Rol.TUTOR)
            .esAdmin(true)
            .build());

    // 5. Asociar al familiar con el mismo proyecto.
    membresiaRepository.save(Membresia.builder()
            .usuario(familiar)
            .proyecto(proyecto)
            .rol(Rol.FAMILIAR)
            .esAdmin(false)
            .build());
}
    @AfterEach
    void limpiarDatos() {

        // Primero borrar las invitaciones para respetar las claves foraneas.
        invitacionRepository.deleteAll(
                invitacionRepository.findByProyectoIdAndEstado(
                        proyecto.getId(),
                        EstadoInvitacion.PENDIENTE
                )
        );

        invitacionRepository.flush();

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId())
        );

        membresiaRepository.flush();

        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutorAdmin, familiar));
    }

    @Test
    void tutorAdminPuedeEnviarInvitacion() throws Exception {

        String email = "docente." + UUID.randomUUID() + "@example.com";

        String request = """
                {
                  "email": "%s",
                  "rol": "EDUCACION"
                }
                """.formatted(email);

        mockMvc.perform(post(
                        "/api/proyectos/" + proyecto.getId() + "/invitaciones")
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.rol").value("EDUCACION"))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.venceEn").exists());

        // Comprobar que efectivamente se guardo una invitacion.
        var invitaciones =
                invitacionRepository.findByProyectoIdAndEstado(
                        proyecto.getId(),
                        EstadoInvitacion.PENDIENTE
                );

        assertEquals(1, invitaciones.size());
        assertEquals(64, invitaciones.get(0).getTokenHash().length());

        // Verificar que se solicito el envio del correo.
        verify(emailService).enviarInvitacion(
        eq(email),
        eq("compartido"),
        contains("https://trama.example/invitacion/")
        );
    }

    private String token(Usuario usuario) {

        return "Bearer " + jwtService.generateToken(usuario.getId());
    }

    @Test
void familiarNoPuedeEnviarInvitacion() throws Exception {

    String request = """
            {
              "email": "docente@ejemplo.test",
              "rol": "EDUCACION"
            }
            """;

    mockMvc.perform(post(
                    "/api/proyectos/" + proyecto.getId() + "/invitaciones")
            .header("Authorization", token(familiar))
            .contentType(MediaType.APPLICATION_JSON)
            .content(request))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.codigo").value("ACCESO_DENEGADO"));

    // Un familiar no debe poder generar invitaciones.
    assertTrue(invitacionRepository.findByProyectoIdAndEstado(
            proyecto.getId(),
            EstadoInvitacion.PENDIENTE
    ).isEmpty());

    // Tampoco debe enviarse un correo.
    verifyNoInteractions(emailService);
}
@Test
void emailInvalidoRecibe400() throws Exception {

    String request = """
            {
              "email": "esto-no-es-un-email",
              "rol": "EDUCACION"
            }
            """;

    mockMvc.perform(post(
                    "/api/proyectos/" + proyecto.getId() + "/invitaciones")
            .header("Authorization", token(tutorAdmin))
            .contentType(MediaType.APPLICATION_JSON)
            .content(request))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"));

    // No debe haberse creado ninguna invitacion.
    assertTrue(invitacionRepository.findByProyectoIdAndEstado(
            proyecto.getId(),
            EstadoInvitacion.PENDIENTE
    ).isEmpty());

    // Tampoco debe intentarse enviar un correo.
    verifyNoInteractions(emailService);
}
}
