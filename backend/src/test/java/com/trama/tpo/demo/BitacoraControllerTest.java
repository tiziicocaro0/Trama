package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
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

import com.fasterxml.jackson.databind.ObjectMapper;
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
class BitacoraControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private Usuario tutorAutor;
    private Usuario otroTutor;
    private Usuario profesionalSalud;
    private Usuario profesionalEducacion;
    private Proyecto proyecto;

    // PREPARACIÓN DE DATOS

    @BeforeEach
    void prepararDatos() {
        tutorAutor = crearUsuario("Autor");
        otroTutor = crearUsuario("OtroTutor");
        profesionalSalud = crearUsuario("Salud");
        profesionalEducacion = crearUsuario("Educacion");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutorAutor, Rol.TUTOR, true);
        crearMembresia(otroTutor, Rol.TUTOR, false);
        crearMembresia(profesionalSalud, Rol.SALUD, false);
        crearMembresia(profesionalEducacion, Rol.EDUCACION, false);
    }

    @AfterEach
    void limpiarDatos() {
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), false));

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), true));

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));

        proyectoRepository.delete(proyecto);

        usuarioRepository.deleteAll(List.of(
                tutorAutor, otroTutor,
                profesionalSalud, profesionalEducacion));
    }

    // TEST 1: FILTROS COMBINADOS

    @Test
    void filtrarBitacoraPorContextoYEtiqueta() throws Exception {
        crearObservacion(tutorAutor, "Observación 1",
                "2026-10-20", "ESCUELA", "LOGRO", "TODOS");

        crearObservacion(tutorAutor, "Observación 2",
                "2026-10-21", "ESCUELA", "DIFICULTAD", "TODOS");

        crearObservacion(tutorAutor, "Observación 3",
                "2026-10-22", "CASA", "LOGRO", "TODOS");

        mockMvc.perform(get(rutaBitacora())
                .param("contexto", "ESCUELA")
                .param("etiqueta", "LOGRO")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo").value("Observación 1"));
    }

    // TEST 2: RANGO DE FECHAS

    @Test
    void filtrarBitacoraPorRangoDeFechas() throws Exception {
        crearObservacion(tutorAutor, "Observación 1",
                "2026-10-10", "ESCUELA", "LOGRO", "TODOS");

        crearObservacion(tutorAutor, "Observación 2",
                "2026-10-15", "ESCUELA", "LOGRO", "TODOS");

        crearObservacion(tutorAutor, "Observación 3",
                "2026-10-20", "ESCUELA", "LOGRO", "TODOS");

        mockMvc.perform(get(rutaBitacora())
                .param("desde", "2026-10-15")
                .param("hasta", "2026-10-20")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].titulo").value("Observación 3"))
                .andExpect(jsonPath("$[1].titulo").value("Observación 2"));
    }

    // TEST 3: FILTRO POR AUTOR

    @Test
    void filtrarBitacoraPorAutor() throws Exception {
        crearObservacion(tutorAutor, "Observación del tutor 1",
                "2026-10-20", "ESCUELA", "LOGRO", "TODOS");

        crearObservacion(otroTutor, "Observación del tutor 2",
                "2026-10-21", "CASA", "SOCIAL", "TODOS");

        mockMvc.perform(get(rutaBitacora())
                .param("autorId", tutorAutor.getId().toString())
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo")
                        .value("Observación del tutor 1"))
                .andExpect(jsonPath("$[0].autorId")
                        .value(tutorAutor.getId().toString()));
    }

    // TEST 4: PAGINACIÓN DE 20

    @Test
    void paginarBitacoraDeAVeinte() throws Exception {
        for (int i = 1; i <= 25; i++) {
            crearObservacion(tutorAutor, "Observación " + i,
                    "2026-10-%02d".formatted(i),
                    "ESCUELA", "LOGRO", "TODOS");
        }

        mockMvc.perform(get(rutaBitacora())
                .param("pagina", "0")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(20))
                .andExpect(jsonPath("$[0].titulo").value("Observación 25"))
                .andExpect(jsonPath("$[19].titulo").value("Observación 6"));

        mockMvc.perform(get(rutaBitacora())
                .param("pagina", "1")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0].titulo").value("Observación 5"))
                .andExpect(jsonPath("$[4].titulo").value("Observación 1"));

        mockMvc.perform(get(rutaBitacora())
                .param("pagina", "2")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // TEST 5: PARÁMETROS INVÁLIDOS

    @Test
    void rechazarParametrosInvalidosBitacora() throws Exception {
        mockMvc.perform(get(rutaBitacora())
                .param("pagina", "-1")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get(rutaBitacora())
                .param("desde", "2026-10-25")
                .param("hasta", "2026-10-20")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isBadRequest());
    }

    // TEST 6: PERMISOS DE VISIBILIDAD

    @Test
    void filtrarBitacoraRespetaVisibilidad() throws Exception {
        crearObservacion(tutorAutor, "Observación restringida",
                "2026-10-20", "CONSULTORIO", "SALUD", "SOLO_SALUD");

        mockMvc.perform(get(rutaBitacora())
                .param("contexto", "CONSULTORIO")
                .param("etiqueta", "SALUD")
                .header("Authorization", token(profesionalSalud)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo")
                        .value("Observación restringida"));

        mockMvc.perform(get(rutaBitacora())
                .param("contexto", "CONSULTORIO")
                .param("etiqueta", "SALUD")
                .header("Authorization", token(profesionalEducacion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // MÉTODOS AUXILIARES

    private void crearObservacion(
            Usuario autor, String titulo, String fecha,
            String contexto, String etiqueta, String visibilidad)
            throws Exception {

        String datos = mapper.writeValueAsString(Map.of(
                "fecha", fecha + "T10:00:00-03:00",
                "contexto", contexto,
                "etiquetas", List.of(etiqueta)));

        String request = mapper.writeValueAsString(Map.of(
                "tipo", "OBSERVACION",
                "titulo", titulo,
                "contenido", "Actividad registrada",
                "datos", datos,
                "visibilidad", visibilidad));

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(autor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID()
                        + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(
            Usuario usuario, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(esAdmin)
                .build());
    }

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String rutaBitacora() {
        return "/api/proyectos/" + proyecto.getId() + "/bitacora";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}