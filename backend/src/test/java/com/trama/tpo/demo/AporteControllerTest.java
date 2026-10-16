package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AporteControllerTest {

    private static final String APORTE_VALIDO = """
            {
              "tipo": "FORTALEZA",
              "titulo": "Le gusta dibujar",
              "contenido": "Disfruta dibujar animales",
              "datos": "{}",
              "visibilidad": "TODOS"
            }
            """;

    private static final String APORTE_EDITADO = """
            {
              "tipo": "FORTALEZA",
              "titulo": "Le gusta pintar",
              "contenido": "Disfruta pintar con acuarelas",
              "datos": "{}",
              "visibilidad": "TODOS"
            }
            """;

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

    private Usuario tutorAutor;
    private Usuario otroTutor;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {

        tutorAutor = crearUsuario("Autor");
        otroTutor = crearUsuario("OtroTutor");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutorAutor, true);
        crearMembresia(otroTutor, false);
    }

    @AfterEach
    void limpiarDatos() {

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), false));

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), true));

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));

        proyectoRepository.delete(proyecto);

        usuarioRepository.deleteAll(List.of(tutorAutor, otroTutor));
    }

    // CRITERIO 1: un miembro autorizado puede crear un aporte
    @Test
    void crearAporteExitosamente() throws Exception {

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(APORTE_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Le gusta dibujar"))
                .andExpect(jsonPath("$.tipo").value("FORTALEZA"))
                .andExpect(jsonPath("$.autorId")
                        .value(tutorAutor.getId().toString()))
                .andExpect(jsonPath("$.archivado").value(false));
    }

    // CRITERIO 2: solamente el autor puede editar su aporte
    @Test
    void autorPuedeEditarSuAporte() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(put(rutaAportes() + "/" + aporte.getId())
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(APORTE_EDITADO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Le gusta pintar"))
                .andExpect(jsonPath("$.contenido")
                        .value("Disfruta pintar con acuarelas"));
    }

    // CRITERIO 3: otro miembro no puede editar el aporte
    @Test
    void otroUsuarioNoPuedeEditarAporteAjeno() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(put(rutaAportes() + "/" + aporte.getId())
                .header("Authorization", token(otroTutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(APORTE_EDITADO))
                .andExpect(status().isForbidden());
    }

    // CRITERIO 4: otro miembro no puede archivar el aporte
    @Test
    void otroUsuarioNoPuedeArchivarAporteAjeno() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(post(rutaAportes() + "/" + aporte.getId() + "/archivar")
                .header("Authorization", token(otroTutor)))
                .andExpect(status().isForbidden());
    }

    // CRITERIO 5: archivar no elimina físicamente el aporte
    @Test
    void autorPuedeArchivarSinEliminarAporte() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(post(rutaAportes() + "/" + aporte.getId() + "/archivar")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isNoContent());

        Aporte archivado = aporteRepository.findById(aporte.getId())
                .orElseThrow();

        org.junit.jupiter.api.Assertions.assertTrue(
                archivado.getArchivado());
    }

    // CRITERIO 6: un miembro puede listar aportes no archivados
    @Test
    void miembroPuedeListarAportes() throws Exception {

        crearAporte();

        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(otroTutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo")
                        .value("Le gusta dibujar"))
                .andExpect(jsonPath("$[0].autorId")
                        .value(tutorAutor.getId().toString()));
    }

    private Aporte crearAporte() {

        return aporteRepository.saveAndFlush(Aporte.builder()
                .proyecto(proyecto)
                .autor(tutorAutor)
                .tipo(com.trama.tpo.demo.aporte.TipoAporte.FORTALEZA)
                .titulo("Le gusta dibujar")
                .contenido("Disfruta dibujar animales")
                .datos("{}")
                .visibilidad(com.trama.tpo.demo.aporte.Visibilidad.TODOS)
                .archivado(false)
                .build());
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

    private void crearMembresia(Usuario usuario, boolean esAdmin) {

        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(Rol.TUTOR)
                .esAdmin(esAdmin)
                .build());
    }

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}