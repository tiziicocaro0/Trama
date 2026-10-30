package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.SuscripcionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// 9.1: suscripción del profesional con pago simulado.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SuscripcionControllerTest {

    private static final String RUTA = "/api/suscripcion";
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

    private Usuario psicologa;
    private Usuario familiar;
    private final List<Proyecto> proyectos = new ArrayList<>();

    @BeforeEach
    void prepararDatos() {
        psicologa = crearUsuario("PsicologaPlan");
        familiar = crearUsuario("FamiliarPlan");
        for (int i = 0; i < 3; i++) {
            Proyecto proyecto = proyectoRepository.save(Proyecto.builder()
                    .nombre("Nina" + i).apellido("Ficticia")
                    .fechaNacimiento(LocalDate.of(2018, 3, 1))
                    .escuela("Escuela de prueba").grado("2.º grado")
                    .consentimientoFecha(Instant.now())
                    .build());
            proyectos.add(proyecto);
            Membresia membresia = membresiaRepository.save(Membresia.builder()
                    .usuario(psicologa).proyecto(proyecto).rol(Rol.SALUD).build());
            jdbc.update("UPDATE membresia SET fecha_alta = ? WHERE id = UUID_TO_BIN(?)",
                    java.sql.Timestamp.from(Instant.parse("2026-02-0" + (i + 1) + "T10:00:00Z")),
                    membresia.getId().toString());
        }
        membresiaRepository.save(Membresia.builder()
                .usuario(familiar).proyecto(proyectos.get(0)).rol(Rol.TUTOR).esAdmin(true).build());
    }

    @AfterEach
    void limpiarDatos() {
        suscripcionRepository.deleteById(psicologa.getId());
        suscripcionRepository.deleteById(familiar.getId());
        for (Proyecto proyecto : proyectos) {
            aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
            proyectoRepository.delete(proyecto);
        }
        usuarioRepository.deleteAll(List.of(psicologa, familiar));
    }

    @Test
    void unProfesionalVeSuPlanGratuitoYLosPrecios() throws Exception {
        mockMvc.perform(get(RUTA).header("Authorization", token(psicologa)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.esProfesional").value(true))
                .andExpect(jsonPath("$.plan").value("GRATUITO"))
                .andExpect(jsonPath("$.proyectosGratuitos").value(2))
                .andExpect(jsonPath("$.planes[0].periodo").value("MENSUAL"))
                .andExpect(jsonPath("$.planes[0].precioArs").value(4500))
                .andExpect(jsonPath("$.planes[1].periodo").value("SEMESTRAL"))
                .andExpect(jsonPath("$.planes[1].precioArs").value(24000));
    }

    @Test
    void unaFamiliaNoEsProfesional() throws Exception {
        mockMvc.perform(get(RUTA).header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.esProfesional").value(false));
    }

    @Test
    void alSuscribirseElTercerProyectoPasaAEditable() throws Exception {
        cargarFortaleza(proyectos.get(2)).andExpect(status().isForbidden());

        suscribirse("MENSUAL")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("MENSUAL"))
                .andExpect(jsonPath("$.hasta").value(LocalDate.now().plusMonths(1).toString()));

        cargarFortaleza(proyectos.get(2)).andExpect(status().isCreated());
    }

    @Test
    void elPlanSemestralDuraSeisMeses() throws Exception {
        suscribirse("SEMESTRAL")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("SEMESTRAL"))
                .andExpect(jsonPath("$.hasta").value(LocalDate.now().plusMonths(6).toString()));
    }

    @Test
    void alCancelarVuelveAlLimiteDeDos() throws Exception {
        suscribirse("MENSUAL").andExpect(status().isOk());

        mockMvc.perform(delete(RUTA).header("Authorization", token(psicologa)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plan").value("GRATUITO"));

        cargarFortaleza(proyectos.get(2))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("SOLO_LECTURA"));
    }

    @Test
    void noSePuedeSuscribirDosVeces() throws Exception {
        suscribirse("MENSUAL").andExpect(status().isOk());
        suscribirse("SEMESTRAL")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("YA_SUSCRIPTO"));
    }

    @Test
    void cancelarSinSuscripcionDevuelve404() throws Exception {
        mockMvc.perform(delete(RUTA).header("Authorization", token(psicologa)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("SIN_SUSCRIPCION"));
    }

    @Test
    void unPlanInexistenteDevuelve400() throws Exception {
        suscribirse("ANUAL").andExpect(status().isBadRequest());
        mockMvc.perform(post(RUTA).header("Authorization", token(psicologa))
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sinSesionDevuelve401() throws Exception {
        mockMvc.perform(get(RUTA)).andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------

    private ResultActions suscribirse(String periodo) throws Exception {
        return mockMvc.perform(post(RUTA)
                .header("Authorization", token(psicologa))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"periodo\":\"" + periodo + "\"}"));
    }

    private ResultActions cargarFortaleza(Proyecto proyecto) throws Exception {
        return mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/aportes")
                .header("Authorization", token(psicologa))
                .contentType(MediaType.APPLICATION_JSON)
                .content(FORTALEZA));
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
