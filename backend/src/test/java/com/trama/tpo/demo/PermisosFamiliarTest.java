package com.trama.tpo.demo;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
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

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

// 1.8: el tutor administrador decide qué pueden hacer y ver los familiares
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PermisosFamiliarTest {

    private static final String SIN_CARGA = """
            {"familiarPuedeCargar":false,"familiarVeNotas":false}""";
    private static final String CON_CARGA = """
            {"familiarPuedeCargar":true,"familiarVeNotas":false}""";
    private static final String VE_NOTAS = """
            {"familiarPuedeCargar":false,"familiarVeNotas":true}""";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario otroFamiliar;
    private Usuario psicologa;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");
        otroFamiliar = crearUsuario("Abuela");
        psicologa = crearUsuario("Psicologa");
        // Valores por defecto: el familiar puede cargar y no ve las notas profesionales
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
        crearMembresia(otroFamiliar, Rol.FAMILIAR, false);
        crearMembresia(psicologa, Rol.SALUD, false);
    }

    @AfterEach
    void limpiarDatos() {
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        for (boolean archivado : List.of(false, true)) {
            aporteRepository.deleteAll(aporteRepository
                    .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), archivado));
        }
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(tutora, familiar, otroFamiliar, psicologa));
    }

    // CRITERIO 1 (test de la card): un familiar sin permiso de carga recibe 403 al crear un aporte
    @Test
    void familiarSinPermisoDeCargaRecibe403AlCrearUnAporte() throws Exception {
        configurar(SIN_CARGA).andExpect(status().isOk());

        crearFortaleza(familiar).andExpect(status().isForbidden());
    }

    @Test
    void cuandoElTutorHabilitaLaCargaElFamiliarPuedeCrear() throws Exception {
        configurar(SIN_CARGA).andExpect(status().isOk());
        crearFortaleza(familiar).andExpect(status().isForbidden());

        configurar(CON_CARGA).andExpect(status().isOk());

        crearFortaleza(familiar).andExpect(status().isCreated());
    }

    // CRITERIO 2: por defecto los familiares no ven las notas profesionales
    @Test
    void sinPermisoElFamiliarNoRecibeLasNotasEnElListado() throws Exception {
        Aporte nota = crearNota(Visibilidad.TODOS);

        listar(familiar).andExpect(jsonPath("$[*].id", not(hasItem(nota.getId().toString()))));
        listar(tutora).andExpect(jsonPath("$[*].id", hasItem(nota.getId().toString())));
        listar(psicologa).andExpect(jsonPath("$[*].id", hasItem(nota.getId().toString())));
    }

    @Test
    void sinPermisoElFamiliarNoPuedeAbrirUnaNota() throws Exception {
        Aporte nota = crearNota(Visibilidad.TODOS);

        mockMvc.perform(get(rutaAportes() + "/" + nota.getId() + "/versiones")
                        .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
    }

    @Test
    void cuandoElTutorLoHabilitaElFamiliarVeLasNotas() throws Exception {
        Aporte nota = crearNota(Visibilidad.TODOS);

        configurar(VE_NOTAS).andExpect(status().isOk());

        listar(familiar).andExpect(jsonPath("$[*].id", hasItem(nota.getId().toString())));
        mockMvc.perform(get(rutaAportes() + "/" + nota.getId() + "/versiones")
                        .header("Authorization", token(familiar)))
                .andExpect(status().isOk());
    }

    // CRITERIO 3: el cambio se aplica a todos los familiares del niño
    @Test
    void elCambioSeAplicaATodosLosFamiliares() throws Exception {
        Aporte nota = crearNota(Visibilidad.TODOS);
        listar(otroFamiliar).andExpect(jsonPath("$[*].id", not(hasItem(nota.getId().toString()))));

        configurar(VE_NOTAS).andExpect(status().isOk());

        listar(familiar).andExpect(jsonPath("$[*].id", hasItem(nota.getId().toString())));
        listar(otroFamiliar).andExpect(jsonPath("$[*].id", hasItem(nota.getId().toString())));
    }

    // Aunque esté habilitado, una nota reservada al área de salud sigue sin verse (misma regla que el aviso 6.0)
    @Test
    void unaNotaSoloSaludSigueOcultaAunqueEsteHabilitado() throws Exception {
        Aporte nota = crearNota(Visibilidad.SOLO_SALUD);

        configurar(VE_NOTAS).andExpect(status().isOk());

        listar(familiar).andExpect(jsonPath("$[*].id", not(hasItem(nota.getId().toString()))));
        mockMvc.perform(get(rutaAportes() + "/" + nota.getId() + "/versiones")
                        .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
    }

    // ---------- Datos de prueba ----------

    private ResultActions configurar(String json) throws Exception {
        return mockMvc.perform(put("/api/proyectos/" + proyecto.getId() + "/configuracion")
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private ResultActions crearFortaleza(Usuario autor) throws Exception {
        return mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(autor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"tipo":"FORTALEZA","titulo":"Le gusta dibujar","contenido":"Texto de prueba",
                         "datos":"{\\"contexto\\":\\"ESCUELA\\"}","visibilidad":"TODOS"}"""));
    }

    private ResultActions listar(Usuario usuario) throws Exception {
        return mockMvc.perform(get(rutaAportes()).header("Authorization", token(usuario)))
                .andExpect(status().isOk());
    }

    // Directo en la base: el foco de este test es quién la ve, no la carga de notas (4.2)
    private Aporte crearNota(Visibilidad visibilidad) {
        return aporteRepository.save(Aporte.builder()
                .proyecto(proyecto)
                .autor(psicologa)
                .tipo(TipoAporte.NOTA_PROFESIONAL)
                .titulo("Nota de prueba")
                .contenido("Texto de prueba")
                .visibilidad(visibilidad)
                .build());
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(Usuario usuario, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin)
                .build());
    }

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
