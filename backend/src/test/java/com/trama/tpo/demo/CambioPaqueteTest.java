package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.plan.Paquete;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.InstitucionRepository;
import com.trama.tpo.demo.repository.InvitacionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.PaqueteRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// 9.3: al superar un cupo, la institución pasa sola al paquete siguiente y queda un aviso.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CambioPaqueteTest {

    private static final String RUTA = "/api/institucion";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private InvitacionRepository invitacionRepository;
    @Autowired private InstitucionRepository institucionRepository;
    @Autowired private PaqueteRepository paqueteRepository;

    private Usuario responsable;
    private Usuario tutora;
    private final List<Usuario> usuarios = new ArrayList<>();
    private final List<Proyecto> proyectos = new ArrayList<>();

    @BeforeEach
    void prepararDatos() {
        responsable = crearUsuario("ResponsableCupo");
        tutora = crearUsuario("TutoraCupo");
    }

    @AfterEach
    void limpiarDatos() {
        institucionRepository.findByResponsableId(responsable.getId()).ifPresent(institucionRepository::delete);
        for (Proyecto proyecto : proyectos) {
            invitacionRepository.deleteAll(invitacionRepository.findAll().stream()
                    .filter(i -> i.getProyecto().getId().equals(proyecto.getId())).toList());
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
            proyectoRepository.delete(proyecto);
        }
        usuarioRepository.deleteAll(usuarios);
    }

    @Test
    void conElCupoDeProfesionalesLlenoAsociarUnoMasCambiaElPaquete() throws Exception {
        contratar("Inicial");
        for (int i = 0; i < 5; i++) {
            asociar(profesionalConNinos("Prof" + i, 1)).andExpect(jsonPath("$.paquete.nombre").value("Inicial"));
        }

        asociar(profesionalConNinos("ProfSexto", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paquete.nombre").value("Intermedio"))
                .andExpect(jsonPath("$.profesionalesUsados").value(6))
                .andExpect(jsonPath("$.aviso.paqueteAnterior").value("Inicial"))
                .andExpect(jsonPath("$.aviso.motivo").value("PROFESIONALES"));
    }

    @Test
    void siUnProfesionalConLicenciaSumaUnNinoYSuperaElCupoCambiaElPaquete() throws Exception {
        contratar("Inicial");
        Usuario docente = profesionalConNinos("DocenteCupo", 15);
        asociar(docente)
                .andExpect(jsonPath("$.ninosUsados").value(15))
                .andExpect(jsonPath("$.paquete.nombre").value("Inicial"));

        // Acepta la invitación a un niño número 16
        Proyecto nuevo = crearProyecto("NinoNuevo");
        mockMvc.perform(post("/api/invitaciones/{token}/aceptar", invitar(docente, nuevo))
                        .header("Authorization", token(docente)))
                .andExpect(status().isCreated());

        mockMvc.perform(get(RUTA)
                        .header("Authorization", token(responsable)))
                .andExpect(jsonPath("$.institucion.paquete.nombre").value("Intermedio"))
                .andExpect(jsonPath("$.institucion.ninosUsados").value(16))
                .andExpect(jsonPath("$.institucion.aviso.motivo").value("NINOS"));
    }

    @Test
    void elUltimoPaqueteNoTieneLimite() throws Exception {
        contratar("Red");
        for (int i = 0; i < 6; i++) {
            asociar(profesionalConNinos("ProfRed" + i, 1));
        }
        mockMvc.perform(get(RUTA)
                        .header("Authorization", token(responsable)))
                .andExpect(jsonPath("$.institucion.paquete.nombre").value("Red"))
                .andExpect(jsonPath("$.institucion.profesionalesUsados").value(6))
                .andExpect(jsonPath("$.institucion.aviso").doesNotExist());
    }

    @Test
    void elResponsableCierraElAviso() throws Exception {
        contratar("Inicial");
        for (int i = 0; i < 6; i++) {
            asociar(profesionalConNinos("ProfAviso" + i, 1));
        }

        mockMvc.perform(put(RUTA + "/aviso").header("Authorization", token(responsable)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paquete.nombre").value("Intermedio"))
                .andExpect(jsonPath("$.aviso").doesNotExist());
    }

    @Test
    void cerrarElAvisoSinInstitucionDevuelve404() throws Exception {
        mockMvc.perform(put(RUTA + "/aviso").header("Authorization", token(tutora)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("SIN_INSTITUCION"));
    }

    // ---------------------------------------------------------------

    private void contratar(String paquete) throws Exception {
        UUID paqueteId = paqueteRepository.findAllByOrderByPrecioAsc().stream()
                .filter(p -> p.getNombre().equals(paquete)).map(Paquete::getId).findFirst().orElseThrow();
        mockMvc.perform(post(RUTA)
                        .header("Authorization", token(responsable))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Centro Ficticio\",\"paqueteId\":\"" + paqueteId + "\"}"))
                .andExpect(status().isCreated());
    }

    private ResultActions asociar(Usuario profesional) throws Exception {
        return mockMvc.perform(post(RUTA + "/profesionales")
                .header("Authorization", token(responsable))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + profesional.getEmail() + "\"}"));
    }

    /** Un profesional de educación que ya trabaja en «cantidad» niños. */
    private Usuario profesionalConNinos(String nombre, int cantidad) {
        Usuario profesional = crearUsuario(nombre);
        for (int i = 0; i < cantidad; i++) {
            Proyecto proyecto = crearProyecto(nombre + "Nino" + i);
            membresiaRepository.save(Membresia.builder()
                    .usuario(profesional).proyecto(proyecto).rol(Rol.EDUCACION).build());
        }
        return profesional;
    }

    private String invitar(Usuario profesional, Proyecto proyecto) throws Exception {
        String token = "token-" + UUID.randomUUID();
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
        invitacionRepository.saveAndFlush(Invitacion.builder()
                .proyecto(proyecto)
                .invitadoPor(tutora)
                .email(profesional.getEmail())
                .rol(Rol.EDUCACION)
                .tokenHash(HexFormat.of().formatHex(hash))
                .venceEn(Instant.now().plus(1, ChronoUnit.DAYS))
                .estado(EstadoInvitacion.PENDIENTE)
                .build());
        return token;
    }

    private Proyecto crearProyecto(String nombre) {
        Proyecto proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre(nombre).apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2016, 9, 1))
                .escuela("Escuela de prueba").grado("5.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        proyectos.add(proyecto);
        membresiaRepository.save(Membresia.builder()
                .usuario(tutora).proyecto(proyecto).rol(Rol.TUTOR).esAdmin(true).build());
        return proyecto;
    }

    private Usuario crearUsuario(String nombre) {
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
        usuarios.add(usuario);
        return usuario;
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
