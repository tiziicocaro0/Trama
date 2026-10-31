package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.NotificacionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;
import com.trama.tpo.demo.service.NotificacionService;

/** 6.1: cada usuario elige qué notificaciones le llegan también por mail. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "trama.app.url=https://trama.example/")
class PreferenciasNotificacionTest {

    private static final String RUTA = "/api/notificaciones/preferencias";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private NotificacionRepository notificacionRepository;
    @Autowired private NotificacionService notificacionService;

    // Simula el envío: no usa Mailpit ni manda mails reales.
    @MockBean private EmailService emailService;

    private Usuario ana;
    private Usuario juan;

    @BeforeEach
    void prepararDatos() {
        ana = crearUsuario("Ana");
        juan = crearUsuario("Juan");
    }

    @AfterEach
    void limpiarDatos() {
        // Las preferencias y las notificaciones se borran en cascada con el usuario.
        usuarioRepository.deleteAll(List.of(ana, juan));
    }

    @Test
    void porDefectoTodosLosAvisosConfigurablesLleganPorMail() throws Exception {
        mockMvc.perform(get(RUTA).header("Authorization", token(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0].tipo").value("CAMBIO_CALENDARIO"))
                .andExpect(jsonPath("$[1].tipo").value("NOTA_NUEVA"))
                .andExpect(jsonPath("$[2].tipo").value("MENCION"))
                .andExpect(jsonPath("$[3].tipo").value("REVISION"))
                .andExpect(jsonPath("$[4].tipo").value("CAMBIO_PAQUETE"))
                .andExpect(jsonPath("$[*].porEmail").value(org.hamcrest.Matchers.everyItem(
                        org.hamcrest.Matchers.is(true))));
    }

    @Test
    void apagarUnTipoSoloCambiaEseTipoYSoloParaQuienLoApaga() throws Exception {
        guardar(ana, "[{\"tipo\":\"NOTA_NUEVA\",\"porEmail\":false}]")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[1].tipo").value("NOTA_NUEVA"))
                .andExpect(jsonPath("$[1].porEmail").value(false))
                .andExpect(jsonPath("$[0].porEmail").value(true));

        // Se puede volver a prender
        guardar(ana, "[{\"tipo\":\"NOTA_NUEVA\",\"porEmail\":true}]")
                .andExpect(jsonPath("$[1].porEmail").value(true));
        guardar(ana, "[{\"tipo\":\"NOTA_NUEVA\",\"porEmail\":false}]");

        mockMvc.perform(get(RUTA).header("Authorization", token(juan)))
                .andExpect(jsonPath("$[1].porEmail").value(true));
    }

    @Test
    void lasInvitacionesNoSePuedenApagar() throws Exception {
        guardar(ana, "[{\"tipo\":\"INVITACION\",\"porEmail\":false}]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("TIPO_NO_CONFIGURABLE"));
    }

    @Test
    void unTipoRepetidoOUnaListaVaciaDevuelven400() throws Exception {
        guardar(ana, "[]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("PREFERENCIAS_VACIAS"));
        guardar(ana, "[{\"tipo\":\"MENCION\",\"porEmail\":false},{\"tipo\":\"MENCION\",\"porEmail\":true}]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("PREFERENCIA_REPETIDA"));
    }

    @Test
    void sinSesionNoSeVenNiSeCambian() throws Exception {
        mockMvc.perform(get(RUTA)).andExpect(status().isUnauthorized());
        mockMvc.perform(put(RUTA).contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"tipo\":\"MENCION\",\"porEmail\":false}]"))
                .andExpect(status().isUnauthorized());
    }

    // Criterio de la card: con el mail desactivado para un tipo, no se envía mail.
    @Test
    void conElMailApagadoParaUnTipoNoSeEnviaMailPeroSiLlegaALaCampana() throws Exception {
        guardar(ana, "[{\"tipo\":\"CAMBIO_PAQUETE\",\"porEmail\":false}]");

        notificacionService.notificar(List.of(ana.getId(), juan.getId()),
                "CAMBIO_PAQUETE", "Tu institución pasó al paquete Intermedio.", "/institucion");

        verify(emailService).enviarNotificacion(
                juan.getEmail(), "Tu institución pasó al paquete Intermedio.",
                "https://trama.example/institucion");
        verify(emailService, never()).enviarNotificacion(eq(ana.getEmail()), anyString(), any());
        assertEquals(1, notificacionRepository
                .findByUsuarioIdOrderByFechaDesc(ana.getId(), PageRequest.of(0, 10)).size());
    }

    @Test
    void unTipoQueNoEsConfigurableNoMandaMail() {
        notificacionService.notificar(List.of(ana.getId()), "NOVEDAD", "Texto", "/inicio");
        notificacionService.notificar(List.of(ana.getId()), "INVITACION", "Te invitaron", "/inicio");

        verify(emailService, never()).enviarNotificacion(anyString(), anyString(), any());
    }

    @Test
    void siFallaElCorreoLaNotificacionQuedaIgual() {
        doThrow(new IllegalStateException("SMTP caído"))
                .when(emailService).enviarNotificacion(anyString(), anyString(), any());

        notificacionService.notificar(List.of(ana.getId()),
                "CAMBIO_PAQUETE", "Tu institución pasó al paquete Intermedio.", "/institucion");

        assertEquals(1, notificacionRepository
                .findByUsuarioIdOrderByFechaDesc(ana.getId(), PageRequest.of(0, 10)).size());
    }

    private org.springframework.test.web.servlet.ResultActions guardar(Usuario usuario, String cuerpo)
            throws Exception {
        return mockMvc.perform(put(RUTA)
                .header("Authorization", token(usuario))
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo));
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
}
