
package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

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

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
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
class AporteVisibilidadTest {

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

    @Autowired
    private AporteRepository aporteRepository;

    @Autowired
    private AporteVersionRepository aporteVersionRepository;

    private Usuario tutor;
    private Usuario familiar;
    private Proyecto proyecto;

    // ==========================================
    // PREPARACIÓN DE DATOS
    // ==========================================

    @BeforeEach
    void prepararDatos() {

        tutor = crearUsuario("TutorVisibilidad");
        familiar = crearUsuario("FamiliarVisibilidad");

        proyecto = proyectoRepository.save(
                Proyecto.builder()
                        .nombre("Niño")
                        .apellido("Visibilidad")
                        .fechaNacimiento(LocalDate.of(2017, 1, 1))
                        .escuela("Escuela de prueba")
                        .grado("3.º grado")
                        .consentimientoFecha(Instant.now())
                        .build()
        );

        crearMembresia(tutor, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    // ==========================================
    // TEST 1: VISIBILIDAD DEL FAMILIAR
    // ==========================================

    @Test
    void familiarSoloPuedeVerAportesPublicos() throws Exception {

        crearAporte("Aporte público", Visibilidad.TODOS);
        crearAporte("Solo tutores", Visibilidad.SOLO_TUTORES);
        crearAporte("Solo salud", Visibilidad.SOLO_SALUD);
        crearAporte("Solo educación", Visibilidad.SOLO_EDUCACION);

        mockMvc.perform(
                get("/api/proyectos/" + proyecto.getId() + "/aportes")
                        .header(
                                "Authorization",
                                "Bearer " + jwtService.generateToken(familiar.getId())
                        )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo").value("Aporte público"))
                .andExpect(jsonPath("$[0].visibilidad").value("TODOS"));
    }

    // ==========================================
    // TEST 2: USUARIO SIN MEMBRESÍA
    // ==========================================

    @Test
    void usuarioAjenoNoPuedeListarAportes() throws Exception {

        Usuario usuarioAjeno = crearUsuario("UsuarioAjeno");

        try {

            crearAporte("Aporte público", Visibilidad.TODOS);

            mockMvc.perform(
                    get("/api/proyectos/" + proyecto.getId() + "/aportes")
                            .header(
                                    "Authorization",
                                    "Bearer " + jwtService.generateToken(usuarioAjeno.getId())
                            )
                    )
                    .andExpect(status().isForbidden());

        } finally {

            usuarioRepository.delete(usuarioAjeno);
        }
    }

    @Test
    void cambiarVisibilidadOcultaAporteAlFamiliar() throws Exception {

        // 1. El tutor crea un aporte visible para todos
        Aporte aporte = crearAporte("Fortaleza", Visibilidad.TODOS);

        String url = "/api/proyectos/" + proyecto.getId() + "/aportes";

        String tokenTutor = "Bearer " + jwtService.generateToken(tutor.getId());
        String tokenFamiliar = "Bearer " + jwtService.generateToken(familiar.getId());

        // 2. Antes del cambio, el familiar puede verlo
        mockMvc.perform(get(url)
                .header("Authorization", tokenFamiliar))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        // 3. El tutor cambia la visibilidad a SOLO_TUTORES
        String request = """
                {
                    "tipo": "FORTALEZA",
                    "titulo": "Fortaleza",
                    "contenido": "Contenido de prueba",
                    "datos": "{\\"contexto\\":\\"ESCUELA\\"}",
                    "visibilidad": "SOLO_TUTORES"
                }
                """;

        mockMvc.perform(put(url + "/" + aporte.getId())
                .header("Authorization", tokenTutor)
                .contentType("application/json")
                .content(request))
                .andExpect(status().isOk());

        // 4. El familiar ya no puede verlo
        mockMvc.perform(get(url)
                .header("Authorization", tokenFamiliar))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        // 5. El tutor sigue pudiendo verlo
        mockMvc.perform(get(url)
                .header("Authorization", tokenTutor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].visibilidad").value("SOLO_TUTORES"));
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    private Usuario crearUsuario(String nombre) {

        return usuarioRepository.save(
                Usuario.builder()
                        .nombre(nombre)
                        .apellido("Prueba")
                        .email(
                                nombre.toLowerCase()
                                        + "."
                                        + UUID.randomUUID()
                                        + "@example.com"
                        )
                        .passwordHash("no-se-usa-en-estos-tests")
                        .build()
        );
    }

    private void crearMembresia(
            Usuario usuario,
            Rol rol,
            boolean esAdmin) {

        membresiaRepository.save(
                Membresia.builder()
                        .usuario(usuario)
                        .proyecto(proyecto)
                        .rol(rol)
                        .esAdmin(esAdmin)
                        .build()
        );
    }

    private Aporte crearAporte(
            String titulo,
            Visibilidad visibilidad) {

        return aporteRepository.saveAndFlush(
                Aporte.builder()
                        .proyecto(proyecto)
                        .autor(tutor)
                        .tipo(TipoAporte.FORTALEZA)
                        .titulo(titulo)
                        .contenido("Contenido de prueba")
                        .datos("{\"contexto\":\"ESCUELA\"}")
                        .visibilidad(visibilidad)
                        .archivado(false)
                        .build()
        );
    }

    // ==========================================
    // LIMPIEZA DE DATOS
    // ==========================================

    @AfterEach
    void limpiarDatos() {

        // Eliminar versiones de aportes
        aporteVersionRepository.eliminarPorProyectoId(
                proyecto.getId()
        );

        // Eliminar aportes activos
        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(),
                        false
                )
        );

        // Eliminar aportes archivados
        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(),
                        true
                )
        );

        // Eliminar membresías
        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(
                        proyecto.getId()
                )
        );

        // Eliminar proyecto
        proyectoRepository.delete(proyecto);

        // Eliminar usuarios
        usuarioRepository.deleteAll(
                List.of(tutor, familiar)
        );
    }
}