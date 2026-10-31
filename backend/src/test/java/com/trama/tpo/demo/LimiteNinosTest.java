package com.trama.tpo.demo;

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
import org.springframework.test.web.servlet.ResultActions;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// 9.4: cualquier cuenta crea o administra hasta 2 niños como tutora.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LimiteNinosTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;

    private Usuario madre;
    private Usuario otraMadre;

    @BeforeEach
    void prepararDatos() {
        madre = crearUsuario("MadreLimite");
        otraMadre = crearUsuario("OtraMadreLimite");
    }

    @AfterEach
    void limpiarDatos() {
        java.util.Set<UUID> proyectos = new java.util.HashSet<>();
        for (Usuario usuario : List.of(madre, otraMadre)) {
            for (Membresia membresia : membresiaRepository.findAll()) {
                if (membresia.getUsuario().getId().equals(usuario.getId())) {
                    proyectos.add(membresia.getProyecto().getId());
                }
            }
        }
        for (UUID proyectoId : proyectos) {
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyectoId));
            proyectoRepository.deleteById(proyectoId);
        }
        usuarioRepository.deleteAll(List.of(madre, otraMadre));
    }

    @Test
    void creaDosNinosYElTerceroDevuelveUnErrorClaro() throws Exception {
        crear(madre, "Primero").andExpect(status().isCreated());
        crear(madre, "Segundo").andExpect(status().isCreated());

        crear(madre, "Tercero")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("LIMITE_NINOS"))
                .andExpect(jsonPath("$.mensaje").value("Cada cuenta puede crear hasta 2 acompañamientos."));
    }

    @Test
    void serCoTutoraDeUnNinoTambienCuenta() throws Exception {
        crear(madre, "Propio").andExpect(status().isCreated());
        Proyecto ajeno = proyectoRepository.save(Proyecto.builder()
                .nombre("Ajeno").apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2017, 4, 2))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        membresiaRepository.save(Membresia.builder()
                .usuario(otraMadre).proyecto(ajeno).rol(Rol.TUTOR).esAdmin(true).build());
        membresiaRepository.save(Membresia.builder()
                .usuario(madre).proyecto(ajeno).rol(Rol.TUTOR).esAdmin(true).build());

        crear(madre, "Otro").andExpect(status().isConflict());
        crear(otraMadre, "Segundo de la otra").andExpect(status().isCreated());
    }

    @Test
    void serFamiliarOProfesionalEnOtrosNinosNoCuenta() throws Exception {
        for (int i = 0; i < 3; i++) {
            Proyecto proyecto = proyectoRepository.save(Proyecto.builder()
                    .nombre("Sobrino" + i).apellido("Ficticio")
                    .fechaNacimiento(LocalDate.of(2016, 1, 1))
                    .escuela("Escuela de prueba").grado("4.º grado")
                    .consentimientoFecha(Instant.now())
                    .build());
            membresiaRepository.save(Membresia.builder()
                    .usuario(otraMadre).proyecto(proyecto).rol(Rol.TUTOR).esAdmin(true).build());
            membresiaRepository.save(Membresia.builder()
                    .usuario(madre).proyecto(proyecto).rol(i == 0 ? Rol.FAMILIAR : Rol.EDUCACION).build());
        }

        crear(madre, "Propio").andExpect(status().isCreated());
    }

    // ---------------------------------------------------------------

    private ResultActions crear(Usuario usuario, String nombre) throws Exception {
        return mockMvc.perform(post("/api/proyectos")
                .header("Authorization", "Bearer " + jwtService.generateToken(usuario.getId()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"" + nombre + "\",\"apellido\":\"Ficticio\","
                        + "\"fechaNacimiento\":\"2017-05-12\",\"escuela\":\"Escuela de prueba\","
                        + "\"grado\":\"3.º grado\",\"consentimiento\":true}"));
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }
}
