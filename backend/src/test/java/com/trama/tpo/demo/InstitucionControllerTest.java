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

import com.jayway.jsonpath.JsonPath;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.plan.Paquete;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.InstitucionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.PaqueteRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// 9.2: paquete institucional, asociación de profesionales y límite gratuito.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class InstitucionControllerTest {

    private static final String RUTA = "/api/institucion";
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
    @Autowired private InstitucionRepository institucionRepository;
    @Autowired private PaqueteRepository paqueteRepository;

    private Usuario responsable;
    private Usuario otroResponsable;
    private Usuario docente;
    private final List<Usuario> usuarios = new ArrayList<>();
    private final List<Proyecto> proyectos = new ArrayList<>();

    @BeforeEach
    void prepararDatos() {
        responsable = crearUsuario("ResponsableInst");
        otroResponsable = crearUsuario("OtroResponsable");
        docente = crearUsuario("DocenteInst");
        // El docente trabaja en 3 niños: sin licencia, el tercero es solo lectura
        for (int i = 0; i < 3; i++) {
            Proyecto proyecto = crearProyecto("Nino" + i);
            Membresia membresia = membresiaRepository.save(Membresia.builder()
                    .usuario(docente).proyecto(proyecto).rol(Rol.EDUCACION).build());
            jdbc.update("UPDATE membresia SET fecha_alta = ? WHERE id = UUID_TO_BIN(?)",
                    java.sql.Timestamp.from(Instant.parse("2026-03-0" + (i + 1) + "T10:00:00Z")),
                    membresia.getId().toString());
        }
    }

    @AfterEach
    void limpiarDatos() {
        for (Usuario usuario : usuarios) {
            institucionRepository.findByResponsableId(usuario.getId()).ifPresent(institucionRepository::delete);
        }
        for (Proyecto proyecto : proyectos) {
            aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
            proyectoRepository.delete(proyecto);
        }
        usuarioRepository.deleteAll(usuarios);
    }

    @Test
    void sinInstitucionMuestraLosTresPaquetesDeMenorAMayor() throws Exception {
        mockMvc.perform(get(RUTA).header("Authorization", token(responsable)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.institucion").doesNotExist())
                .andExpect(jsonPath("$.paquetes.length()").value(3))
                .andExpect(jsonPath("$.paquetes[0].nombre").value("Inicial"))
                .andExpect(jsonPath("$.paquetes[0].cupoNinos").value(15))
                .andExpect(jsonPath("$.paquetes[0].cupoProfesionales").value(5))
                .andExpect(jsonPath("$.paquetes[0].precioArs").value(18000))
                .andExpect(jsonPath("$.paquetes[2].nombre").value("Red"))
                .andExpect(jsonPath("$.paquetes[2].cupoNinos").doesNotExist());
    }

    @Test
    void contrataUnPaqueteConPagoSimulado() throws Exception {
        contratar(responsable, "Inicial")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombre").value("Escuela Ficticia"))
                .andExpect(jsonPath("$.paquete.nombre").value("Inicial"))
                .andExpect(jsonPath("$.profesionalesUsados").value(0));

        contratar(responsable, "Red")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("YA_ES_RESPONSABLE"));
    }

    @Test
    void elProfesionalAsociadoNoConsumeSuLimiteGratuito() throws Exception {
        cargarFortaleza(proyectos.get(2)).andExpect(status().isForbidden());
        contratar(responsable, "Inicial").andExpect(status().isCreated());

        asociar(responsable, docente.getEmail())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profesionalesUsados").value(1))
                .andExpect(jsonPath("$.ninosUsados").value(3))
                .andExpect(jsonPath("$.profesionales[0].email").value(docente.getEmail()));

        cargarFortaleza(proyectos.get(2)).andExpect(status().isCreated());
        mockMvc.perform(get("/api/suscripcion").header("Authorization", token(docente)))
                .andExpect(jsonPath("$.plan").value("INSTITUCIONAL"))
                .andExpect(jsonPath("$.institucion").value("Escuela Ficticia"));
    }

    @Test
    void alQuitarloVuelveAlLimite() throws Exception {
        contratar(responsable, "Inicial").andExpect(status().isCreated());
        String respuesta = asociar(responsable, docente.getEmail()).andReturn().getResponse().getContentAsString();
        String licenciaId = JsonPath.read(respuesta, "$.profesionales[0].licenciaId");

        mockMvc.perform(delete(RUTA + "/profesionales/" + licenciaId).header("Authorization", token(responsable)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profesionalesUsados").value(0));

        cargarFortaleza(proyectos.get(2))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("SOLO_LECTURA"));
    }

    @Test
    void elResponsableNoVeNingunPerfilDeNino() throws Exception {
        contratar(responsable, "Inicial").andExpect(status().isCreated());
        asociar(responsable, docente.getEmail()).andExpect(status().isOk());

        mockMvc.perform(get("/api/proyectos/" + proyectos.get(0).getId()).header("Authorization", token(responsable)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unEmailSinCuentaDevuelveUnErrorClaro() throws Exception {
        contratar(responsable, "Inicial").andExpect(status().isCreated());
        asociar(responsable, "nadie." + UUID.randomUUID() + "@example.com")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("EMAIL_NO_REGISTRADO"));
    }

    @Test
    void noSeAsociaDosVecesAlMismoProfesional() throws Exception {
        contratar(responsable, "Inicial").andExpect(status().isCreated());
        asociar(responsable, docente.getEmail()).andExpect(status().isOk());
        asociar(responsable, docente.getEmail())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("YA_ASOCIADO"));
    }

    @Test
    void nadiePuedeQuitarProfesionalesDeOtraInstitucion() throws Exception {
        contratar(responsable, "Inicial").andExpect(status().isCreated());
        contratar(otroResponsable, "Inicial").andExpect(status().isCreated());
        String respuesta = asociar(responsable, docente.getEmail()).andReturn().getResponse().getContentAsString();
        String licenciaId = JsonPath.read(respuesta, "$.profesionales[0].licenciaId");

        mockMvc.perform(delete(RUTA + "/profesionales/" + licenciaId).header("Authorization", token(otroResponsable)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("LICENCIA_NO_ENCONTRADA"));
    }

    @Test
    void sinInstitucionNoSePuedeAsociar() throws Exception {
        asociar(responsable, docente.getEmail())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("SIN_INSTITUCION"));
    }

    @Test
    void validaLosDatosDeLaContratacion() throws Exception {
        mockMvc.perform(post(RUTA).header("Authorization", token(responsable))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"nombre\":\"\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(RUTA).header("Authorization", token(responsable))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nombre\":\"Escuela\",\"paqueteId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("PAQUETE_NO_ENCONTRADO"));
    }

    @Test
    void sinSesionDevuelve401() throws Exception {
        mockMvc.perform(get(RUTA)).andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------

    private ResultActions contratar(Usuario usuario, String paquete) throws Exception {
        return mockMvc.perform(post(RUTA)
                .header("Authorization", token(usuario))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Escuela Ficticia\",\"paqueteId\":\"" + paqueteId(paquete) + "\"}"));
    }

    private ResultActions asociar(Usuario usuario, String email) throws Exception {
        return mockMvc.perform(post(RUTA + "/profesionales")
                .header("Authorization", token(usuario))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\"}"));
    }

    private ResultActions cargarFortaleza(Proyecto proyecto) throws Exception {
        return mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/aportes")
                .header("Authorization", token(docente))
                .contentType(MediaType.APPLICATION_JSON)
                .content(FORTALEZA));
    }

    private UUID paqueteId(String nombre) {
        return paqueteRepository.findAllByOrderByPrecioAsc().stream()
                .filter(p -> p.getNombre().equals(nombre))
                .map(Paquete::getId)
                .findFirst()
                .orElseThrow();
    }

    private Proyecto crearProyecto(String nombre) {
        Proyecto proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre(nombre).apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2017, 6, 1))
                .escuela("Escuela de prueba").grado("4.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        proyectos.add(proyecto);
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
