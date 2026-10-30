package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
import com.trama.tpo.demo.repository.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RegistroAccesosTest {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutora;
    private Usuario cotutor;
    private Usuario familiar;
    private Membresia membresiaFamiliar;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        cotutor = crearUsuario("Cotutor");
        familiar = crearUsuario("Familiar");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(cotutor, Rol.TUTOR, false);
        membresiaFamiliar = crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    @AfterEach
    void limpiarDatos() {
        // Al borrar el proyecto, la base borra sus registros en cascada (V5)
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean archivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), archivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, cotutor, familiar));
    }

    // CRITERIO 1: quién, qué hizo, en qué sección y cuándo
    @Test
    void laTutoraVeQuienHizoQue() throws Exception {
        crearAporte(tutora);

        String json = mockMvc.perform(get(rutaRegistro()).header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].usuarioNombre").value("Tutora Prueba"))
                .andExpect(jsonPath("$[0].accion").value("CREAR"))
                .andExpect(jsonPath("$[0].seccion").value("FORTALEZA"))
                .andExpect(jsonPath("$[0].fecha").exists())
                .andReturn().getResponse().getContentAsString();

        assertThat(json).as("no expone emails").doesNotContain("@");
    }

    // CRITERIO 3: solo tutores (también los co-tutores que no son administradores)
    @Test
    void unCotutorQueNoEsAdminTambienPuedeVerlo() throws Exception {
        mockMvc.perform(get(rutaRegistro()).header("Authorization", token(cotutor)))
                .andExpect(status().isOk());
    }

    @Test
    void unFamiliarRecibe403() throws Exception {
        mockMvc.perform(get(rutaRegistro()).header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
    }

    // CRITERIO 2: filtro por miembro
    @Test
    void filtraPorMiembro() throws Exception {
        crearAporte(tutora);
        crearAporte(familiar);

        mockMvc.perform(get(rutaRegistro() + "?usuarioId=" + familiar.getId())
                .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].usuarioNombre").value("Familiar Prueba"));
    }

    // CRITERIO 2: filtro por fechas (los días son de Argentina)
    @Test
    void filtraPorFechas() throws Exception {
        crearAporte(tutora);
        LocalDate hoy = LocalDate.now(ZONA);

        mockMvc.perform(get(rutaRegistro() + "?desde=" + hoy.minusDays(10) + "&hasta=" + hoy.minusDays(1))
                .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get(rutaRegistro() + "?desde=" + hoy + "&hasta=" + hoy)
                .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // A quien le quitaron el acceso se lo sigue viendo con su nombre en el historial
    @Test
    void unMiembroSinAccesoSigueApareciendoConSuNombre() throws Exception {
        crearAporte(familiar);

        mockMvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/miembros/" + membresiaFamiliar.getId())
                .header("Authorization", token(tutora)))
                .andExpect(status().is2xxSuccessful());

        mockMvc.perform(get(rutaRegistro() + "?usuarioId=" + familiar.getId())
                .header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].usuarioNombre").value("Familiar Prueba"))
                .andExpect(jsonPath("$[0].accion").value("CREAR"));
    }

    // CRITERIO 1 ("quién consultó"): abrir la portada deja un VER por persona por día
    @Test
    void abrirLaPortadaDosVecesDejaUnSoloRegistro() throws Exception {
        abrirPortada(familiar);
        abrirPortada(familiar);

        mockMvc.perform(get(rutaRegistro()).header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].usuarioNombre").value("Familiar Prueba"))
                .andExpect(jsonPath("$[0].accion").value("VER"))
                .andExpect(jsonPath("$[0].seccion").value("PERFIL"));
    }

    @Test
    void cadaPersonaQueAbreLaPortadaQuedaRegistrada() throws Exception {
        abrirPortada(familiar);
        abrirPortada(cotutor);

        mockMvc.perform(get(rutaRegistro()).header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void alguienAjenoNoQuedaRegistradoComoVisita() throws Exception {
        Usuario ajeno = crearUsuario("Ajeno");
        try {
            mockMvc.perform(get("/api/proyectos/" + proyecto.getId()).header("Authorization", token(ajeno)))
                    .andExpect(status().isForbidden());

            mockMvc.perform(get(rutaRegistro()).header("Authorization", token(tutora)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(0));
        } finally {
            usuarioRepository.delete(ajeno);
        }
    }

    @Test
    void unRangoInvertidoRecibe400() throws Exception {
        mockMvc.perform(get(rutaRegistro() + "?desde=2026-10-29&hasta=2026-10-01")
                .header("Authorization", token(tutora)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("RANGO_INVALIDO"));
    }

    // ---------- Datos de prueba ----------

    private void crearAporte(Usuario autor) throws Exception {
        mockMvc.perform(post("/api/proyectos/" + proyecto.getId() + "/aportes")
                .header("Authorization", token(autor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"tipo":"FORTALEZA","titulo":"Le gusta dibujar","contenido":"Texto de prueba",
                         "datos":"{\\"contexto\\":\\"ESCUELA\\"}","visibilidad":"TODOS"}"""))
                .andExpect(status().isCreated());
    }

    private void abrirPortada(Usuario usuario) throws Exception {
        mockMvc.perform(get("/api/proyectos/" + proyecto.getId()).header("Authorization", token(usuario)))
                .andExpect(status().isOk());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Membresia crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
        return membresiaRepository.save(Membresia.builder()
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin)
                .build());
    }

    private String rutaRegistro() {
        return "/api/proyectos/" + proyecto.getId() + "/registro-accesos";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
