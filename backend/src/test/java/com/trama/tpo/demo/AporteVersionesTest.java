package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
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
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AporteVersionesTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario ajeno;
    private Proyecto proyecto;
    private Proyecto otroProyecto;

    @BeforeEach
    void prepararDatos() {

        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        ajeno = crearUsuario("Ajeno");

        proyecto = crearProyecto();
        otroProyecto = crearProyecto();

        crearMembresia(tutora, proyecto, Rol.TUTOR, true);
        crearMembresia(familiar, proyecto, Rol.FAMILIAR, false);
        crearMembresia(tutora, otroProyecto, Rol.TUTOR, true);
    }

    @AfterEach
    void limpiarDatos() {

        for (Proyecto p : List.of(proyecto, otroProyecto)) {
            aporteVersionRepository.eliminarPorProyectoId(p.getId());
            aporteRepository.deleteAll(
                    aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(p.getId(), false));
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(p.getId()));
            proyectoRepository.delete(p);
        }

        usuarioRepository.deleteAll(List.of(tutora, familiar, ajeno));
    }

    // ENTREGABLE: después de 2 ediciones hay 2 versiones anteriores (3 con la actual)
    @Test
    void dosEdicionesDejanDosVersionesAnterioresYTresEnElHistorial() throws Exception {

        String aporteId = crearAporte("TODOS");
        editar(aporteId, "Le gusta pintar", "Pinta con acuarelas");
        editar(aporteId, "Le gusta modelar", "Modela con arcilla");

        assertThat(aporteVersionRepository
                .findByAporteIdOrderByCreadoEnAsc(UUID.fromString(aporteId)))
                .hasSize(2);

        mockMvc.perform(get(rutaVersiones(proyecto, aporteId))
                .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].numero").value(3))
                .andExpect(jsonPath("$[0].actual").value(true))
                .andExpect(jsonPath("$[0].titulo").value("Le gusta modelar"))
                .andExpect(jsonPath("$[0].contenido").value("Modela con arcilla"))
                .andExpect(jsonPath("$[1].numero").value(2))
                .andExpect(jsonPath("$[1].titulo").value("Le gusta pintar"))
                .andExpect(jsonPath("$[2].numero").value(1))
                .andExpect(jsonPath("$[2].titulo").value("Le gusta dibujar"))
                .andExpect(jsonPath("$[2].autorNombre").value("Tutora Prueba"));
    }

    // La fecha de modificación de cada versión es la de creación de la siguiente
    @Test
    void lasFechasEncadenan() throws Exception {

        String aporteId = crearAporte("TODOS");
        editar(aporteId, "Le gusta pintar", "Pinta con acuarelas");
        editar(aporteId, "Le gusta modelar", "Modela con arcilla");

        String json = mockMvc.perform(get(rutaVersiones(proyecto, aporteId))
                .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String creadaV3 = JsonPath.read(json, "$[0].fechaCreacion");
        String creadaV2 = JsonPath.read(json, "$[1].fechaCreacion");
        String modificadaV2 = JsonPath.read(json, "$[1].fechaModificacion");
        String modificadaV1 = JsonPath.read(json, "$[2].fechaModificacion");
        Object modificadaV3 = JsonPath.read(json, "$[0].fechaModificacion");

        assertThat(modificadaV3).isNull();
        assertThat(modificadaV2).isEqualTo(creadaV3);
        assertThat(modificadaV1).isEqualTo(creadaV2);
    }

    @Test
    void aporteSinEdicionesTieneUnaSolaVersion() throws Exception {

        String aporteId = crearAporte("TODOS");

        mockMvc.perform(get(rutaVersiones(proyecto, aporteId))
                .header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].numero").value(1))
                .andExpect(jsonPath("$[0].actual").value(true))
                .andExpect(jsonPath("$[0].fechaModificacion").doesNotExist());
    }

    // El historial respeta la visibilidad del aporte
    @Test
    void miembroQueNoPuedeVerElAporteRecibe403() throws Exception {

        String aporteId = crearAporte("SOLO_TUTORES");

        mockMvc.perform(get(rutaVersiones(proyecto, aporteId))
                .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
    }

    @Test
    void ajenoRecibe403() throws Exception {

        String aporteId = crearAporte("TODOS");

        mockMvc.perform(get(rutaVersiones(proyecto, aporteId))
                .header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden());
    }

    @Test
    void aporteDeOtroProyectoDa404() throws Exception {

        String aporteId = crearAporte("TODOS");

        mockMvc.perform(get(rutaVersiones(otroProyecto, aporteId))
                .header("Authorization", token(tutora)))
                .andExpect(status().isNotFound());
    }

    // ---------- Datos de prueba ----------

    private String crearAporte(String visibilidad) throws Exception {

        String json = mockMvc.perform(post(rutaAportes(proyecto))
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content(aporteJson("Le gusta dibujar", "Dibuja animales", visibilidad)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(json, "$.id");
    }

    private void editar(String aporteId, String titulo, String contenido) throws Exception {

        mockMvc.perform(put(rutaAportes(proyecto) + "/" + aporteId)
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content(aporteJson(titulo, contenido, "TODOS")))
                .andExpect(status().isOk());
    }

    private String aporteJson(String titulo, String contenido, String visibilidad) {
        return """
                {
                  "tipo": "FORTALEZA",
                  "titulo": "%s",
                  "contenido": "%s",
                  "datos": "{\\"contexto\\":\\"ESCUELA\\"}",
                  "visibilidad": "%s"
                }
                """.formatted(titulo, contenido, visibilidad);
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Proyecto crearProyecto() {
        return proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
    }

    private void crearMembresia(Usuario usuario, Proyecto p, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(p)
                .rol(rol)
                .esAdmin(esAdmin)
                .build());
    }

    private String rutaAportes(Proyecto p) {
        return "/api/proyectos/" + p.getId() + "/aportes";
    }

    private String rutaVersiones(Proyecto p, String aporteId) {
        return rutaAportes(p) + "/" + aporteId + "/versiones";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
