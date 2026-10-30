package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.MembresiaEspecialidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// 4.2: notas profesionales, solo para educación y salud.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotaProfesionalControllerTest {

    private static final String NOTA_VALIDA = """
            {
              "tipo": "NOTA_PROFESIONAL",
              "titulo": "Orientación para el aula",
              "contenido": "Anticipar los cambios de actividad con el cronograma visual",
              "datos": "{\\"tipoNota\\":\\"ORIENTACION\\",\\"fecha\\":\\"2026-10-29\\"}"
            }
            """;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Proyecto proyecto;
    private Usuario tutora;
    private Usuario familiar;
    private Usuario psicologa;
    private Usuario docente;

    @BeforeEach
    void prepararDatos() {
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        tutora = crearMiembro("TutoraNota", Rol.TUTOR, true, null);
        familiar = crearMiembro("FamiliarNota", Rol.FAMILIAR, false, null);
        psicologa = crearMiembro("PsicologaNota", Rol.SALUD, false, Especialidad.PSICOLOGIA);
        docente = crearMiembro("DocenteNota", Rol.EDUCACION, false, Especialidad.DOCENTE_PRIMARIO);
    }

    @AfterEach
    void limpiarDatos() {
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        aporteRepository.deleteAll(aporteRepository
                .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, psicologa, docente));
    }

    @Test
    void unFamiliarNoPuedeCrearUnaNota() throws Exception {
        crearNota(familiar, NOTA_VALIDA).andExpect(status().isForbidden());
    }

    @Test
    void unTutorNoPuedeCrearUnaNota() throws Exception {
        crearNota(tutora, NOTA_VALIDA).andExpect(status().isForbidden());
    }

    @Test
    void unaProfesionalDeSaludCreaUnaNotaConSuEspecialidad() throws Exception {
        crearNota(psicologa, NOTA_VALIDA)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("NOTA_PROFESIONAL"))
                .andExpect(jsonPath("$.autorNombre").value("PsicologaNota Prueba"))
                .andExpect(jsonPath("$.autorEspecialidades[0].especialidad").value("PSICOLOGIA"))
                // Sin visibilidad elegida, queda para su área (y los tutores)
                .andExpect(jsonPath("$.visibilidad").value("SOLO_SALUD"));
    }

    @Test
    void unaNotaDeEducacionQuedaParaEducacionPorDefecto() throws Exception {
        crearNota(docente, NOTA_VALIDA)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.visibilidad").value("SOLO_EDUCACION"));
    }

    @Test
    void elAutorEligeQuienPuedeVerla() throws Exception {
        crearNota(psicologa, NOTA_VALIDA.replace(
                "\"tipo\": \"NOTA_PROFESIONAL\",",
                "\"tipo\": \"NOTA_PROFESIONAL\", \"visibilidad\": \"TODOS\","))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.visibilidad").value("TODOS"));
    }

    @Test
    void unaNotaSinTipoNiFechaDevuelve400() throws Exception {
        crearNota(psicologa, """
                {"tipo": "NOTA_PROFESIONAL", "titulo": "Sin datos", "datos": "{}"}
                """)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_NOTA_INVALIDOS"));
    }

    @Test
    void soloElAutorEditaSuNota() throws Exception {
        String respuesta = crearNota(psicologa, NOTA_VALIDA.replace(
                "\"tipo\": \"NOTA_PROFESIONAL\",",
                "\"tipo\": \"NOTA_PROFESIONAL\", \"visibilidad\": \"TODOS\","))
                .andReturn().getResponse().getContentAsString();
        String notaId = JsonPath.read(respuesta, "$.id");

        mockMvc.perform(put(rutaAportes() + "/" + notaId)
                        .header("Authorization", token(docente))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(NOTA_VALIDA))
                .andExpect(status().isForbidden());
    }

    @Test
    void elProyectoIndicaQuienPuedeCargarNotas() throws Exception {
        String rutaProyecto = "/api/proyectos/" + proyecto.getId();

        mockMvc.perform(get(rutaProyecto).header("Authorization", token(psicologa)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeCargarNotas").value(true));

        mockMvc.perform(get(rutaProyecto).header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeCargarNotas").value(false));
    }

    // ---------------------------------------------------------------

    private org.springframework.test.web.servlet.ResultActions crearNota(
            Usuario usuario, String cuerpo) throws Exception {
        return mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(usuario))
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo));
    }

    private Usuario crearMiembro(String nombre, Rol rol, boolean esAdmin, Especialidad especialidad) {
        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());

        Membresia membresia = Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(esAdmin)
                .build();
        if (especialidad != null) {
            membresia.getEspecialidades().add(MembresiaEspecialidad.builder()
                    .membresia(membresia)
                    .especialidad(especialidad)
                    .build());
        }
        membresiaRepository.save(membresia);
        return usuario;
    }

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
