
package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.containsInAnyOrder;

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
class MiembroControllerTest {

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

    @BeforeEach
    void prepararDatos() {

        // Crear los tres usuarios.
        tutorAdmin = crearUsuario("Tutor");
        familiar = crearUsuario("Familiar");
        ajeno = crearUsuario("Ajeno");

        // Crear el proyecto ANTES de las membresias.
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Proyecto")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3")
                .consentimientoFecha(Instant.now())
                .build());

        // El tutor y el familiar pertenecen al proyecto.
        crearMembresia(tutorAdmin, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);

        // El usuario ajeno NO tiene membresia.
    }

    @AfterEach
    void limpiarDatos() {

        // Primero borrar membresias para respetar las claves foraneas.
        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId())
        );

        membresiaRepository.flush();

        proyectoRepository.delete(proyecto);

        usuarioRepository.deleteAll(
                List.of(tutorAdmin, familiar, ajeno)
        );
    }

    @Test
    void miembroPuedeConsultarIntegrantesDelProyecto() throws Exception {

        mockMvc.perform(get(
                        "/api/proyectos/" + proyecto.getId() + "/miembros")
                .header("Authorization", token(familiar)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[*].nombre",
                        containsInAnyOrder("Tutor", "Familiar")))
                .andExpect(jsonPath("$[*].rol",
                        containsInAnyOrder("TUTOR", "FAMILIAR")));
    }

    @Test
    void usuarioAjenoNoPuedeConsultarIntegrantes() throws Exception {

        mockMvc.perform(get(
                        "/api/proyectos/" + proyecto.getId() + "/miembros")
                .header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("ACCESO_DENEGADO"));
    }

    private Usuario crearUsuario(String nombre) {

        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "."
                        + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(
            Usuario usuario,
            Rol rol,
            boolean esAdmin) {

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
