package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
    private Membresia membresiaTutor;
    private Membresia membresiaFamiliar;

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

        membresiaTutor = crearMembresia(tutorAdmin, Rol.TUTOR, true);
        membresiaFamiliar = crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    // Borrar en orden: primero membresías, después proyecto y usuarios
    @AfterEach
    void limpiarDatos() {

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutorAdmin, familiar, ajeno));
    }

    // 1.10: cada miembro ve el niño en "Mis proyectos" con su rol
    @Test
    void miembroVeSuProyectoConSuRol() throws Exception {

        mockMvc.perform(get("/api/proyectos")
                .header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(proyecto.getId().toString()))
                .andExpect(jsonPath("$[0].nombre").value("Niño"))
                .andExpect(jsonPath("$[0].rol").value("FAMILIAR"))
                .andExpect(jsonPath("$[0].esAdmin").value(false));
    }

    // 1.10: alguien que no es miembro no ve el niño en su lista
    @Test
    void ajenoNoVeProyectosQueNoSonSuyos() throws Exception {

        mockMvc.perform(get("/api/proyectos")
                .header("Authorization", token(ajeno)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
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

    // 1.5: un miembro que no es admin no puede quitar acceso (403)
    @Test
    void miembroNoAdminNoPuedeQuitarAccesoRecibe403() throws Exception {

        mockMvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/miembros/" + membresiaFamiliar.getId())
                .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("ACCESO_DENEGADO"));
    }

    // 1.5: nadie se quita el acceso a sí mismo, así el proyecto nunca queda sin su administrador (400)
    @Test
    void elAdminNoSePuedeQuitarElAccesoASiMismoRecibe400() throws Exception {

        mockMvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/miembros/" + membresiaTutor.getId())
                .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("QUITARSE_A_SI_MISMO"));
    }

    // 1.5: un tutor administrador quita el acceso a un miembro (200 OK) y el revocado pierde el acceso al instante (403)
    @Test
    void tutorAdminQuitaAccesoYRevocadoNoPuedeEntrarAlProyecto() throws Exception {

        mockMvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/miembros/" + membresiaFamiliar.getId())
                .header("Authorization", token(tutorAdmin)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/proyectos/" + proyecto.getId())
                .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo").value("ACCESO_DENEGADO"));
    }

    private Usuario crearUsuario(String nombre) {

        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Membresia crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {

        return membresiaRepository.save(Membresia.builder()
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
