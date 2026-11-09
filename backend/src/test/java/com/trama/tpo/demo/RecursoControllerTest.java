package com.trama.tpo.demo;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Recursos del niño: la galería de archivos que sube la red. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RecursoControllerTest {

    private static final String RUTA = "/api/proyectos/{id}/archivos";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private ArchivoRepository archivoRepository;
    @Autowired private AporteRepository aporteRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private Usuario tutora;
    private Usuario psicologa;
    private Usuario familiar;
    private Usuario ajeno;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("TutoraRecurso");
        psicologa = crearUsuario("PsicoRecurso");
        familiar = crearUsuario("FamiliarRecurso");
        ajeno = crearUsuario("AjenoRecurso");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Bruno")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        unir(tutora, Rol.TUTOR, true);
        unir(psicologa, Rol.SALUD, false);
        unir(familiar, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {
        aporteRepository.deleteAll(aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                proyecto.getId(), false));
        archivoRepository.deleteAll(archivoRepository.findByProyectoId(proyecto.getId()));
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, psicologa, familiar, ajeno));
    }

    @Test
    void unRecursoParaTodaLaRedLoVenTodosYSoloLoArchivaQuienLoSubio() throws Exception {
        subirRecurso(tutora, "TODOS", "agenda.pdf");

        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].nombreOriginal").value("agenda.pdf"))
                .andExpect(jsonPath("$[0].origen").value("RECURSO"))
                .andExpect(jsonPath("$[0].autorNombre").value("TutoraRecurso Prueba"))
                .andExpect(jsonPath("$[0].visibilidad").value("TODOS"))
                .andExpect(jsonPath("$[0].puedeArchivar").value(false));

        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(tutora)))
                .andExpect(jsonPath("$[0].puedeArchivar").value(true));
    }

    @Test
    void unRecursoSoloSaludNoLoVeNiLoDescargaUnFamiliar() throws Exception {
        String archivoId = subirRecurso(psicologa, "SOLO_SALUD", "informe.pdf");

        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        mockMvc.perform(get(RUTA + "/{archivoId}", proyecto.getId(), archivoId)
                        .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());

        // La tutora ve todo
        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(tutora)))
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void losAdjuntosDeLosAportesAparecenConSuSeccion() throws Exception {
        String archivoId = subirAdjunto(tutora, "pictograma.png");
        crearFortalezaConAdjunto(archivoId);

        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].archivoId").value(archivoId))
                .andExpect(jsonPath("$[0].origen").value("APORTE"))
                .andExpect(jsonPath("$[0].tipoAporte").value("FORTALEZA"))
                .andExpect(jsonPath("$[0].aporteTitulo").value("Arma rompecabezas"))
                .andExpect(jsonPath("$[0].puedeArchivar").value(false));
    }

    @Test
    void unAdjuntoSueltoSinAporteNoAparece() throws Exception {
        subirAdjunto(tutora, "suelto.png");

        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void elAutorArchivaSuRecursoYDejaDeVerse() throws Exception {
        String archivoId = subirRecurso(psicologa, "TODOS", "plantilla.pdf");

        mockMvc.perform(post(RUTA + "/{archivoId}/archivar", proyecto.getId(), archivoId)
                        .header("Authorization", token(psicologa)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(tutora)))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void nadieArchivaElRecursoDeOtro() throws Exception {
        String archivoId = subirRecurso(psicologa, "TODOS", "plantilla.pdf");

        // Ni siquiera la tutora: como en los aportes, solo el autor
        mockMvc.perform(post(RUTA + "/{archivoId}/archivar", proyecto.getId(), archivoId)
                        .header("Authorization", token(tutora)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unAdjuntoNoSeArchivaDesdeRecursos() throws Exception {
        String archivoId = subirAdjunto(tutora, "pictograma.png");
        crearFortalezaConAdjunto(archivoId);

        mockMvc.perform(post(RUTA + "/{archivoId}/archivar", proyecto.getId(), archivoId)
                        .header("Authorization", token(tutora)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("RECURSO_NO_ARCHIVABLE"));
    }

    @Test
    void alguienAjenoNoVeLosRecursos() throws Exception {
        subirRecurso(tutora, "TODOS", "agenda.pdf");

        mockMvc.perform(get(RUTA, proyecto.getId()).header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden());
    }

    private String subirRecurso(Usuario autor, String visibilidad, String nombre) throws Exception {
        MockMultipartFile pdf = new MockMultipartFile("archivo", nombre, "application/pdf",
                "%PDF-1.4 material ficticio".getBytes(StandardCharsets.UTF_8));

        String json = mockMvc.perform(multipart(RUTA, proyecto.getId())
                        .file(pdf)
                        .param("visibilidad", visibilidad)
                        .header("Authorization", token(autor)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(json).get("id").asText();
    }

    private String subirAdjunto(Usuario autor, String nombre) throws Exception {
        MockMultipartFile png = new MockMultipartFile("archivo", nombre, "image/png",
                new byte[] {(byte) 0x89, 'P', 'N', 'G'});

        String json = mockMvc.perform(multipart(RUTA, proyecto.getId())
                        .file(png)
                        .header("Authorization", token(autor)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(json).get("id").asText();
    }

    private void crearFortalezaConAdjunto(String archivoId) throws Exception {
        String aporte = """
                {"tipo":"FORTALEZA","titulo":"Arma rompecabezas","contenido":"Le encanta",
                 "datos":"{\\"contexto\\":\\"ESCUELA\\"}","visibilidad":"TODOS",
                 "archivoIds":["%s"]}
                """.formatted(archivoId);

        mockMvc.perform(post("/api/proyectos/{id}/aportes", proyecto.getId())
                        .header("Authorization", token(tutora))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(aporte))
                .andExpect(status().isCreated());
    }

    private void unir(Usuario usuario, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(esAdmin)
                .build());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
