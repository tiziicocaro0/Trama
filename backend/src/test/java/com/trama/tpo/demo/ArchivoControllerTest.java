package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ArchivoControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private ArchivoRepository archivoRepository;
    @Autowired private AporteRepository aporteRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private Usuario tutorMiembro;
    private Usuario usuarioAjeno;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutorMiembro = crearUsuario("TutorArchivo");
        usuarioAjeno = crearUsuario("AjenoArchivo");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Mateo")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        membresiaRepository.save(Membresia.builder()
                .usuario(tutorMiembro)
                .proyecto(proyecto)
                .rol(Rol.TUTOR)
                .esAdmin(true)
                .build());
    }

    @AfterEach
    void limpiarDatos() {
        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), false));
        archivoRepository.deleteAll(archivoRepository.findByProyectoId(proyecto.getId()));
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutorMiembro, usuarioAjeno));
    }

    @Test
    void subirPdfOkYDescargarSiendoMiembro() throws Exception {
        byte[] contenidoPdf = "%PDF-1.4 Informe de seguimiento ficticio".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile pdf = new MockMultipartFile(
                "archivo",
                "informe.pdf",
                "application/pdf",
                contenidoPdf
        );

        String respuestaJson = mockMvc.perform(multipart(
                        "/api/proyectos/{id}/archivos", proyecto.getId())
                        .file(pdf)
                        .header("Authorization", token(tutorMiembro)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nombreOriginal").value("informe.pdf"))
                .andExpect(jsonPath("$.tipoMime").value("application/pdf"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String archivoId = mapper.readTree(respuestaJson).get("id").asText();

        // Asociar el archivo a un aporte de COMUNICACION
        String aporteRequest = """
                {
                  "tipo": "COMUNICACION",
                  "titulo": "Agenda visual",
                  "contenido": "Informe y pictograma adjunto",
                  "visibilidad": "TODOS",
                  "archivoIds": ["%s"]
                }
                """.formatted(archivoId);

        mockMvc.perform(post("/api/proyectos/{id}/aportes", proyecto.getId())
                        .header("Authorization", token(tutorMiembro))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(aporteRequest))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.archivoIds[0]").value(archivoId))
                .andExpect(jsonPath("$.archivos[0].nombreOriginal").value("informe.pdf"));

        // Descargar siendo miembro con permiso
        byte[] descargado = mockMvc.perform(get(
                        "/api/proyectos/{id}/archivos/{archivoId}",
                        proyecto.getId(),
                        archivoId)
                        .header("Authorization", token(tutorMiembro)))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        assertArrayEquals(contenidoPdf, descargado);

        // Descargar sin ser miembro -> 403
        mockMvc.perform(get(
                        "/api/proyectos/{id}/archivos/{archivoId}",
                        proyecto.getId(),
                        archivoId)
                        .header("Authorization", token(usuarioAjeno)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("ACCESO_DENEGADO"));
    }

    @Test
    void subirExeDevuelve400() throws Exception {
        MockMultipartFile exe = new MockMultipartFile(
                "archivo",
                "programa.exe",
                "application/octet-stream",
                new byte[]{0x4D, 0x5A, 0x01, 0x02}
        );

        mockMvc.perform(multipart(
                        "/api/proyectos/{id}/archivos", proyecto.getId())
                        .file(exe)
                        .header("Authorization", token(tutorMiembro)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("FORMATO_NO_PERMITIDO"));
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

