package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.plan.Suscripcion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.SuscripcionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// 9.0: un profesional sin suscripción edita en sus 2 primeros niños; en los demás, solo lectura.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PlanFreemiumTest {

    private static final String FORTALEZA = """
            {"tipo":"FORTALEZA","titulo":"Arma rompecabezas","contenido":"Le gusta encastrar piezas",
             "datos":"{\\"contexto\\":\\"ESCUELA\\"}","visibilidad":"TODOS"}""";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;
    @Autowired private SuscripcionRepository suscripcionRepository;

    private Usuario docente;
    private Usuario tutora;
    private final List<Proyecto> proyectos = new ArrayList<>();

    @BeforeEach
    void prepararDatos() {
        docente = crearUsuario("DocentePlan");
        tutora = crearUsuario("TutoraPlan");
        // Tres niños: el docente entró a cada uno en días distintos (el orden lo da la fecha de alta)
        for (int i = 0; i < 3; i++) {
            Proyecto proyecto = proyectoRepository.save(Proyecto.builder()
                    .nombre("Nino" + i).apellido("Ficticio")
                    .fechaNacimiento(LocalDate.of(2017, 1, 1))
                    .escuela("Escuela de prueba").grado("3.º grado")
                    .consentimientoFecha(Instant.now())
                    .build());
            proyectos.add(proyecto);
            crearMembresia(tutora, proyecto, Rol.TUTOR, true);
            Membresia membresia = crearMembresia(docente, proyecto, Rol.EDUCACION, false);
            jdbc.update("UPDATE membresia SET fecha_alta = ? WHERE id = UUID_TO_BIN(?)",
                    java.sql.Timestamp.from(Instant.parse("2026-01-0" + (i + 1) + "T10:00:00Z")),
                    membresia.getId().toString());
        }
    }

    @AfterEach
    void limpiarDatos() {
        suscripcionRepository.deleteById(docente.getId());
        for (Proyecto proyecto : proyectos) {
            aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
            proyectoRepository.delete(proyecto);
        }
        usuarioRepository.deleteAll(List.of(docente, tutora));
    }

    @Test
    void editaEnSusDosPrimerosNinos() throws Exception {
        cargarFortaleza(docente, proyectos.get(0)).andExpect(status().isCreated());
        cargarFortaleza(docente, proyectos.get(1)).andExpect(status().isCreated());
    }

    @Test
    void enElTercerNinoRecibe403SoloLectura() throws Exception {
        cargarFortaleza(docente, proyectos.get(2))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("SOLO_LECTURA"));
    }

    @Test
    void elProyectoIndicaSiEstaEnSoloLecturaPorElPlan() throws Exception {
        verProyecto(docente, proyectos.get(0))
                .andExpect(jsonPath("$.puedeCargar").value(true))
                .andExpect(jsonPath("$.soloLecturaPorPlan").value(false));
        verProyecto(docente, proyectos.get(2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeCargar").value(false))
                .andExpect(jsonPath("$.soloLecturaPorPlan").value(true));
    }

    @Test
    void lasFamiliasNuncaTienenLimite() throws Exception {
        verProyecto(tutora, proyectos.get(2))
                .andExpect(jsonPath("$.puedeCargar").value(true))
                .andExpect(jsonPath("$.soloLecturaPorPlan").value(false));
        cargarFortaleza(tutora, proyectos.get(2)).andExpect(status().isCreated());
    }

    @Test
    void conSuscripcionVigenteEditaEnTodos() throws Exception {
        suscripcionRepository.save(Suscripcion.builder()
                .usuarioId(docente.getId()).desde(LocalDate.now()).hasta(LocalDate.now().plusMonths(1))
                .build());

        cargarFortaleza(docente, proyectos.get(2)).andExpect(status().isCreated());
    }

    @Test
    void conSuscripcionVencidaVuelveAlLimite() throws Exception {
        suscripcionRepository.save(Suscripcion.builder()
                .usuarioId(docente.getId()).desde(LocalDate.now().minusMonths(2))
                .hasta(LocalDate.now().minusDays(1))
                .build());

        cargarFortaleza(docente, proyectos.get(2))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("SOLO_LECTURA"));
    }

    // ---------------------------------------------------------------

    private ResultActions cargarFortaleza(Usuario usuario, Proyecto proyecto) throws Exception {
        return mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/aportes")
                .header("Authorization", token(usuario))
                .contentType(MediaType.APPLICATION_JSON)
                .content(FORTALEZA));
    }

    private ResultActions verProyecto(Usuario usuario, Proyecto proyecto) throws Exception {
        return mockMvc.perform(get("/api/proyectos/" + proyecto.getId())
                .header("Authorization", token(usuario)));
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Membresia crearMembresia(Usuario usuario, Proyecto proyecto, Rol rol, boolean esAdmin) {
        return membresiaRepository.save(Membresia.builder()
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin)
                .build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
