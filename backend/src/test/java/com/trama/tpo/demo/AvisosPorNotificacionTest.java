package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.notificacion.Notificacion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.InvitacionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.NotificacionRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

/**
 * 6.1: las acciones que ya avisan por la campana (y por mail si el usuario quiere):
 * una nota profesional nueva y una invitación a alguien que ya tiene cuenta.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "trama.invitaciones.url-base=https://trama.example/invitaciones")
class AvisosPorNotificacionTest {

    private static final String NOTA = """
            {
              "tipo": "NOTA_PROFESIONAL",
              "titulo": "Orientación para el aula",
              "contenido": "Contenido que no tiene que salir en la notificación",
              "datos": "{\\"tipoNota\\":\\"ORIENTACION\\",\\"fecha\\":\\"2026-10-29\\"}"%s
            }
            """;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;
    @Autowired private NotificacionRepository notificacionRepository;
    @Autowired private InvitacionRepository invitacionRepository;

    @MockBean private EmailService emailService;

    private Proyecto proyecto;
    private Usuario tutora;
    private Usuario familiar;
    private Usuario psicologa;
    private Usuario docente;
    private Usuario conCuenta;

    @BeforeEach
    void prepararDatos() {
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3")
                .consentimientoFecha(Instant.now())
                .build());
        tutora = crearMiembro("Tutora", Rol.TUTOR, true);
        familiar = crearMiembro("Familiar", Rol.FAMILIAR, false);
        psicologa = crearMiembro("Psicologa", Rol.SALUD, false);
        docente = crearMiembro("Docente", Rol.EDUCACION, false);
        conCuenta = crearUsuario("Invitada");
    }

    @AfterEach
    void limpiarDatos() {
        for (EstadoInvitacion estado : EstadoInvitacion.values()) {
            invitacionRepository.deleteAll(
                    invitacionRepository.findByProyectoIdAndEstado(proyecto.getId(), estado));
        }
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        aporteRepository.deleteAll(aporteRepository
                .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, psicologa, docente, conCuenta));
    }

    @Test
    void unaNotaDeSaludAvisaSoloAQuienesPuedenLeerlaYNuncaAlAutor() throws Exception {
        crearNota(psicologa, "").andExpect(status().isCreated());

        List<Notificacion> deLaTutora = notificaciones(tutora);
        assertEquals(1, deLaTutora.size());
        assertEquals("NOTA_NUEVA", deLaTutora.get(0).getTipo());
        assertEquals("Psicologa Prueba escribió una nota nueva.", deLaTutora.get(0).getTexto());
        assertEquals("/proyectos/" + proyecto.getId() + "/notas", deLaTutora.get(0).getLink());

        assertTrue(notificaciones(docente).isEmpty(), "una nota de salud no es para educación");
        assertTrue(notificaciones(familiar).isEmpty());
        assertTrue(notificaciones(psicologa).isEmpty(), "el autor no se avisa a sí mismo");

        // Y por mail, a la tutora (lo tiene activado por defecto)
        verify(emailService).enviarNotificacion(
                org.mockito.ArgumentMatchers.eq(tutora.getEmail()),
                org.mockito.ArgumentMatchers.eq("Psicologa Prueba escribió una nota nueva."),
                any());
    }

    @Test
    void unaNotaParaTodosLlegaAlFamiliarSoloSiElTutorLeHabilitoLasNotas() throws Exception {
        String paraTodos = ", \"visibilidad\": \"TODOS\"";

        crearNota(psicologa, paraTodos).andExpect(status().isCreated());
        assertEquals(1, notificaciones(docente).size());
        assertTrue(notificaciones(familiar).isEmpty());

        proyecto.setFamiliarVeNotas(true);
        proyectoRepository.save(proyecto);

        crearNota(psicologa, paraTodos).andExpect(status().isCreated());
        assertEquals(1, notificaciones(familiar).size());
    }

    @Test
    void invitarAAlguienConCuentaTambienLeLlegaALaCampana() throws Exception {
        invitar(conCuenta.getEmail()).andExpect(status().isCreated());

        List<Notificacion> recibidas = notificaciones(conCuenta);
        assertEquals(1, recibidas.size());
        assertEquals("INVITACION", recibidas.get(0).getTipo());
        assertEquals("Tutora Prueba te invitó a sumarte a un acompañamiento en TRAMA.",
                recibidas.get(0).getTexto());
        assertTrue(recibidas.get(0).getLink().startsWith("/invitaciones/"));

        // Ya le llega el mail propio de la invitación: no se manda un segundo mail
        verify(emailService).enviarInvitacion(anyString(), anyString(), anyString());
        verify(emailService, never()).enviarNotificacion(anyString(), anyString(), any());
    }

    @Test
    void invitarAAlguienSinCuentaSoloMandaElMail() throws Exception {
        invitar("sin.cuenta." + UUID.randomUUID() + "@example.com").andExpect(status().isCreated());

        verify(emailService).enviarInvitacion(anyString(), anyString(), anyString());
        verify(emailService, never()).enviarNotificacion(anyString(), anyString(), any());
    }

    // ---------------------------------------------------------------

    private org.springframework.test.web.servlet.ResultActions crearNota(Usuario autor, String extra)
            throws Exception {
        return mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/aportes")
                .header("Authorization", token(autor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(NOTA.formatted(extra)));
    }

    private org.springframework.test.web.servlet.ResultActions invitar(String email) throws Exception {
        return mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/invitaciones")
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"rol\":\"FAMILIAR\"}"));
    }

    private List<Notificacion> notificaciones(Usuario usuario) {
        return notificacionRepository.findByUsuarioIdOrderByFechaDesc(usuario.getId(), PageRequest.of(0, 10));
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

    private Usuario crearMiembro(String nombre, Rol rol, boolean esAdmin) {
        Usuario usuario = crearUsuario(nombre);
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(esAdmin)
                .build());
        return usuario;
    }
}
