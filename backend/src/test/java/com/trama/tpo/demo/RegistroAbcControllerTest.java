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
class RegistroAbcControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    private Usuario tutor;
    private Usuario familiar;
    private Usuario profesionalSalud;
    private Usuario profesionalEducacion;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutor = crearUsuario("Tutor");
        familiar = crearUsuario("Familiar");
        profesionalSalud = crearUsuario("Salud");
        profesionalEducacion = crearUsuario("Educacion");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Tomás")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 5, 12))
                .escuela("Escuela N.º 12")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutor, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
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
                tutor, familiar, profesionalSalud, profesionalEducacion));
    }

    @Test
    void profesionalCargaRegistroAbcYApareceEnBitacoraParaTodaLaRed() throws Exception {
        String datosAbc = mapper.writeValueAsString(Map.of(
                "antecedente", "Sonó el timbre fuerte del recreo sin anticipación.",
                "conducta", "Se tapó los oídos y buscó salir del aula.",
                "consecuencia", "Salimos al patio tranquilo unos minutos y se calmó.",
                "fecha", "2026-10-25T10:30:00-03:00",
                "contexto", "ESCUELA"));

        String request = mapper.writeValueAsString(Map.of(
                "tipo", "ABC",
                "titulo", "Sonó el timbre fuerte del recreo sin anticipación.",
                "contenido", "Se tapó los oídos y buscó salir del aula.",
                "datos", datosAbc));

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(profesionalEducacion))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("ABC"))
                .andExpect(jsonPath("$.visibilidad").value("TODOS"));

        // Lo ven todos los miembros de la red en el endpoint de la bitácora (4.1)
        for (Usuario miembro : List.of(tutor, familiar, profesionalSalud, profesionalEducacion)) {
            mockMvc.perform(get(rutaBitacora())
                    .header("Authorization", token(miembro)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].tipo").value("ABC"))
                    .andExpect(jsonPath("$[0].titulo")
                            .value("Sonó el timbre fuerte del recreo sin anticipación."));
        }
    }

    @Test
    void rechazaRegistroAbcConDatosIncompletos() throws Exception {
        String datosIncompletos = mapper.writeValueAsString(Map.of(
                "antecedente", "Ruido en el comedor",
                "conducta", "",
                "consecuencia", "Acompañamiento tranquilo",
                "fecha", "2026-10-25T12:00:00-03:00",
                "contexto", "ESCUELA"));

        String request = mapper.writeValueAsString(Map.of(
                "tipo", "ABC",
                "titulo", "Ruido en el comedor",
                "contenido", "Detalle",
                "datos", datosIncompletos));

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(profesionalSalud))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_ABC_INVALIDOS"));
    }

    @Test
    void rechazaQueUnNoProfesionalCargueRegistroAbc() throws Exception {
        String datosAbc = mapper.writeValueAsString(Map.of(
                "antecedente", "Cambio de actividad",
                "conducta", "Enojo breve",
                "consecuencia", "Se anticipó con reloj visual",
                "fecha", "2026-10-25T15:00:00-03:00",
                "contexto", "CASA"));

        String request = mapper.writeValueAsString(Map.of(
                "tipo", "ABC",
                "titulo", "Cambio de actividad",
                "contenido", "Enojo breve",
                "datos", datosAbc));

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(tutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isForbidden());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
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

