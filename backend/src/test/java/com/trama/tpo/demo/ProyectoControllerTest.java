package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProyectoControllerTest {

    private static final String CONFIG_VALIDA =
            "{\"familiarPuedeCargar\":false,\"familiarVeNotas\":true}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProyectoRepository proyectoRepository;

    @Autowired
    private MembresiaRepository membresiaRepository;

    private Usuario tutorAdmin;
    private Usuario familiar;
    private Usuario ajeno;
    private Proyecto proyecto;

    // Un niño con un tutor admin y un familiar; "ajeno" no es miembro
    @BeforeEach
    void prepararDatos() {

        tutorAdmin = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        ajeno = crearUsuario("Ajeno");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutorAdmin, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    // Borrar en orden: primero membresías, después proyecto y usuarios
    @AfterEach
    void limpiarDatos() {

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutorAdmin, familiar, ajeno));
    }

    // CRITERIO 3: un miembro ve al niño
    @Test
    void miembroVeElProyecto() throws Exception {

        mockMvc.perform(get("/api/proyectos/" + proyecto.getId())
                .header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(proyecto.getId().toString()))
                .andExpect(jsonPath("$.nombre").value("Niño"));
    }

    // CRITERIO 3: alguien ajeno es rechazado
    @Test
    void ajenoRecibe403() throws Exception {

        mockMvc.perform(get("/api/proyectos/" + proyecto.getId())
                .header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("ACCESO_DENEGADO"));
    }

    // CRITERIO 4: el tutor admin cambia la configuración
    @Test
    void tutorAdminCambiaConfiguracion() throws Exception {

        mockMvc.perform(put("/api/proyectos/" + proyecto.getId() + "/configuracion")
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content(CONFIG_VALIDA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.familiarPuedeCargar").value(false))
                .andExpect(jsonPath("$.familiarVeNotas").value(true));
    }

    // CRITERIO 4: un miembro que no es admin es rechazado
    @Test
    void familiarNoPuedeCambiarConfiguracion() throws Exception {

        mockMvc.perform(put("/api/proyectos/" + proyecto.getId() + "/configuracion")
                .header("Authorization", token(familiar))
                .contentType(MediaType.APPLICATION_JSON)
                .content(CONFIG_VALIDA))
                .andExpect(status().isForbidden());
    }

    // Validación: sin campos, 400
    @Test
    void configuracionIncompletaRecibe400() throws Exception {

        mockMvc.perform(put("/api/proyectos/" + proyecto.getId() + "/configuracion")
                .header("Authorization", token(tutorAdmin))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"));
    }

    // CRITERIO 5: un UUID inventado no revela si el niño existe
    @Test
    void uuidInventadoRecibe403() throws Exception {

        mockMvc.perform(get("/api/proyectos/" + UUID.randomUUID())
                .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isForbidden());
    }

    // CRITERIO 5: un id numérico no sirve
    @Test
    void idNumericoRecibe400() throws Exception {

        mockMvc.perform(get("/api/proyectos/1")
                .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"));
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

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
