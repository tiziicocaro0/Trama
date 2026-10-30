package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.lang.reflect.Method;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
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

import com.jayway.jsonpath.JsonPath;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.registro.RegistroAccion;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;
import com.trama.tpo.demo.service.EmailService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
// Invitar arma un enlace con esta dirección: en los tests no hay una configurada
@TestPropertySource(properties = "trama.invitaciones.url-base=https://trama.example/invitacion")
class RegistroAccionTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;
    @Autowired private RegistroAccionRepository registroAccionRepository;

    // Para no mandar mails reales al invitar
    @MockBean private EmailService emailService;

    private Usuario tutora;
    private Usuario familiar;
    private Membresia membresiaFamiliar;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        membresiaFamiliar = crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {
        // Al borrar el proyecto, la base borra sus registros en cascada (V5)
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean archivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), archivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar));
    }

    // ENTREGABLE: al crear un aporte queda un registro con usuario, acción y sección
    @Test
    void crearUnAporteDejaUnRegistro() throws Exception {
        crearAporte("Le gusta dibujar");

        List<RegistroAccion> registros = registros();

        assertThat(registros).hasSize(1);
        RegistroAccion registro = registros.get(0);
        assertThat(registro.getUsuarioId()).isEqualTo(tutora.getId());
        assertThat(registro.getAccion()).isEqualTo(AccionRegistro.CREAR);
        assertThat(registro.getSeccion()).isEqualTo("FORTALEZA");
        assertThat(registro.getFecha()).isNotNull();
    }

    @Test
    void editarYArchivarDejanSusRegistros() throws Exception {
        String aporteId = crearAporte("Le gusta dibujar");

        mockMvc.perform(put(rutaAportes() + "/" + aporteId)
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content(aporteJson("Le gusta pintar")))
                .andExpect(status().isOk());

        mockMvc.perform(post(rutaAportes() + "/" + aporteId + "/archivar")
                .header("Authorization", token(tutora)))
                .andExpect(status().is2xxSuccessful());

        // La fecha tiene precisión de segundos: se comparan las acciones, no su orden
        assertThat(registros()).extracting(RegistroAccion::getAccion)
                .containsExactlyInAnyOrder(AccionRegistro.CREAR, AccionRegistro.EDITAR, AccionRegistro.ARCHIVAR);
        assertThat(registros()).extracting(RegistroAccion::getSeccion).containsOnly("FORTALEZA");
    }

    @Test
    void invitarDejaUnRegistroSinElEmail() throws Exception {
        String email = "invitada." + UUID.randomUUID() + "@example.com";

        mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/invitaciones")
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"rol\":\"FAMILIAR\"}"))
                .andExpect(status().is2xxSuccessful());

        RegistroAccion registro = registros().get(0);
        assertThat(registro.getAccion()).isEqualTo(AccionRegistro.INVITAR);
        assertThat(registro.getSeccion()).isEqualTo("MIEMBROS").doesNotContain(email);
    }

    @Test
    void quitarUnMiembroDejaUnRegistro() throws Exception {
        mockMvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/miembros/" + membresiaFamiliar.getId())
                .header("Authorization", token(tutora)))
                .andExpect(status().is2xxSuccessful());

        RegistroAccion registro = registros().get(0);
        assertThat(registro.getUsuarioId()).isEqualTo(tutora.getId());
        assertThat(registro.getAccion()).isEqualTo(AccionRegistro.REVOCAR);
        assertThat(registro.getSeccion()).isEqualTo("MIEMBROS");
    }

    @Test
    void unaAccionRechazadaNoDejaRegistro() throws Exception {
        String aporteId = crearAporte("Le gusta dibujar");

        // La familiar no es la autora: no puede archivar
        mockMvc.perform(post(rutaAportes() + "/" + aporteId + "/archivar")
                .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());

        assertThat(registros()).extracting(RegistroAccion::getAccion)
                .containsExactly(AccionRegistro.CREAR);
    }

    @Test
    void laAuditoriaNoSePuedeModificar() {
        assertThat(Arrays.stream(RegistroAccionRepository.class.getMethods()).map(Method::getName))
                .noneMatch(nombre -> nombre.startsWith("delete"));
        assertThat(Arrays.stream(RegistroAccion.class.getMethods()).map(Method::getName))
                .noneMatch(nombre -> nombre.startsWith("set"));
    }

    // ---------- Datos de prueba ----------

    private List<RegistroAccion> registros() {
        return registroAccionRepository.findByProyectoIdOrderByFechaDesc(proyecto.getId());
    }

    private String crearAporte(String titulo) throws Exception {
        String json = mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content(aporteJson(titulo)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.id");
    }

    private String aporteJson(String titulo) {
        return """
                {"tipo":"FORTALEZA","titulo":"%s","contenido":"Texto de prueba",
                 "datos":"{\\"contexto\\":\\"ESCUELA\\"}","visibilidad":"TODOS"}
                """.formatted(titulo);
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Membresia crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
        return membresiaRepository.save(Membresia.builder()
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin)
                .build());
    }

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
