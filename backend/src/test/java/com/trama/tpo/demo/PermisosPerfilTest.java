package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

/**
 * 2.0 + 3.0: el front decide que botones mostrar con puedeCargar (proyecto)
 * y puedeEditar (cada aporte). El back es quien calcula los dos.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PermisosPerfilTest {

    private static final String FORTALEZA = """
            {
              "tipo": "FORTALEZA",
              "titulo": "Arma rompecabezas",
              "datos": "{\\"contexto\\":\\"CASA\\"}",
              "visibilidad": "TODOS"
            }
            """;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutor;
    private Usuario otroTutor;
    private Usuario familiar;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {

        tutor = crearUsuario("Tutor");
        otroTutor = crearUsuario("OtroTutor");
        familiar = crearUsuario("Familiar");

        // Por defecto el familiar NO puede cargar (familiarPuedeCargar = false)
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .familiarPuedeCargar(false)
                .build());

        crearMembresia(tutor, Rol.TUTOR, true);
        crearMembresia(otroTutor, Rol.TUTOR, false);
        crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {

        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        aporteRepository.deleteAll(aporteRepository
                .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutor, otroTutor, familiar));
    }

    @Test
    void elProyectoIndicaSiElUsuarioPuedeCargar() throws Exception {

        mockMvc.perform(get(rutaProyecto()).header("Authorization", token(tutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeCargar").value(true));

        mockMvc.perform(get(rutaProyecto()).header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeCargar").value(false));
    }

    @Test
    void soloElAutorVeSuAporteComoEditable() throws Exception {

        mockMvc.perform(post(rutaProyecto() + "/aportes")
                        .header("Authorization", token(tutor))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORTALEZA))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.puedeEditar").value(true));

        mockMvc.perform(get(rutaProyecto() + "/aportes").header("Authorization", token(tutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].puedeEditar").value(true));

        // Otro tutor puede cargar, pero el aporte no es suyo
        mockMvc.perform(get(rutaProyecto() + "/aportes").header("Authorization", token(otroTutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].puedeEditar").value(false));

        // El familiar ve el aporte pero no puede editarlo
        mockMvc.perform(get(rutaProyecto() + "/aportes").header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].puedeEditar").value(false));
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

    private String rutaProyecto() {
        return "/api/proyectos/" + proyecto.getId();
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
