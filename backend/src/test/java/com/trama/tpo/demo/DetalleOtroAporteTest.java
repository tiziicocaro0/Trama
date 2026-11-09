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

/** Al elegir «Otro» en un aporte se puede aclarar cuál, con un texto corto. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DetalleOtroAporteTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private ArchivoRepository archivoRepository;

    private Usuario tutora;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = usuarioRepository.save(Usuario.builder()
                .nombre("TutoraOtro")
                .apellido("Prueba")
                .email("tutora.otro." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Lara")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        membresiaRepository.save(Membresia.builder()
                .usuario(tutora).proyecto(proyecto).rol(Rol.TUTOR).esAdmin(true).build());
    }

    @AfterEach
    void limpiarDatos() {
        aporteRepository.deleteAll(aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                proyecto.getId(), false));
        archivoRepository.deleteAll(archivoRepository.findByProyectoId(proyecto.getId()));
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.delete(tutora);
    }

    @Test
    void unaFortalezaEnOtroContextoGuardaCual() throws Exception {
        crear("FORTALEZA", "{\\\"contexto\\\":\\\"OTRO\\\",\\\"contextoOtro\\\":\\\"Club de natación\\\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.datos").value(org.hamcrest.Matchers.containsString("Club de natación")));
    }

    @Test
    void unInteresDeOtraCategoriaGuardaCual() throws Exception {
        crear("INTERES", "{\\\"categoria\\\":\\\"OTRO\\\",\\\"intensidad\\\":\\\"ALTA\\\",\\\"categoriaOtra\\\":\\\"Mapas\\\"}")
                .andExpect(status().isCreated());
    }

    @Test
    void elDetalleDeOtroNoPuedeSerLargo() throws Exception {
        String largo = "x".repeat(61);
        crear("FORTALEZA", "{\\\"contexto\\\":\\\"OTRO\\\",\\\"contextoOtro\\\":\\\"" + largo + "\\\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DETALLE_OTRO_INVALIDO"));
    }

    @Test
    void unAporteDelPerfilSinDescripcionNoSeGuarda() throws Exception {
        String cuerpo = """
                {"tipo":"FORTALEZA","titulo":"Prueba","contenido":"   ","datos":"{\\"contexto\\":\\"CASA\\"}","visibilidad":"TODOS"}
                """;
        mockMvc.perform(post("/api/proyectos/{id}/aportes", proyecto.getId())
                        .header("Authorization", "Bearer " + jwtService.generateToken(tutora.getId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("CONTENIDO_OBLIGATORIO"));
    }

    private org.springframework.test.web.servlet.ResultActions crear(String tipo, String datos) throws Exception {
        String cuerpo = """
                {"tipo":"%s","titulo":"Prueba","contenido":"Texto","datos":"%s","visibilidad":"TODOS"}
                """.formatted(tipo, datos);
        return mockMvc.perform(post("/api/proyectos/{id}/aportes", proyecto.getId())
                .header("Authorization", "Bearer " + jwtService.generateToken(tutora.getId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(cuerpo));
    }
}
