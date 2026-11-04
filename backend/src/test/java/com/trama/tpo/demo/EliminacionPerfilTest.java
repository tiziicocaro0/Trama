package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.NotificacionRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EliminacionProyectoService;

/** 8.2: eliminar el perfil del niño, con 7 días para arrepentirse. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestPropertySource(properties = "trama.archivos.directorio=target/uploads-eliminacion-test")
class EliminacionPerfilTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private ArchivoRepository archivoRepository;
    @Autowired private NotificacionRepository notificacionRepository;
    @Autowired private EliminacionProyectoService eliminacionService;

    private Usuario tutor;
    private Usuario docente;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutor = crearUsuario("Tutora");
        docente = crearUsuario("Docente");
        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba").grado("3")
                .consentimientoFecha(Instant.now())
                .build());
        crearMembresia(tutor, Rol.TUTOR, true);
        crearMembresia(docente, Rol.EDUCACION, false);
    }

    @AfterEach
    void limpiarDatos() {
        if (proyectoRepository.existsById(proyecto.getId())) {
            aporteRepository.deleteAll(aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
            archivoRepository.deleteAll(archivoRepository.findByProyectoId(proyecto.getId()));
            membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
            proyectoRepository.delete(proyecto);
        }
        usuarioRepository.deleteAll(List.of(tutor, docente));
    }

    @Test
    void elTutorProgramaLaEliminacionASieteDiasYLaRedSeEntera() throws Exception {
        mockMvc.perform(post(ruta()).header("Authorization", token(tutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eliminacionProgramada").exists());

        Instant cuando = proyectoRepository.findById(proyecto.getId()).orElseThrow().getEliminacionProgramada();
        assertNotNull(cuando);
        long dias = Duration.between(Instant.now(), cuando).toHours();
        assertTrue(dias > 7 * 24 - 2 && dias <= 7 * 24, "vence a los 7 días");

        // La portada sabe que está programada
        mockMvc.perform(get("/api/proyectos/" + proyecto.getId()).header("Authorization", token(docente)))
                .andExpect(jsonPath("$.eliminacionProgramada").exists());

        // Se avisa a la red, no a quien la programó
        var avisos = notificacionRepository.findByUsuarioIdOrderByFechaDesc(docente.getId(), PageRequest.of(0, 10));
        assertEquals(1, avisos.size());
        assertEquals("ELIMINACION_PERFIL", avisos.get(0).getTipo());
        assertFalse(avisos.get(0).getTexto().contains("Niño"), "el aviso no lleva el nombre del niño");
        assertTrue(notificacionRepository.findByUsuarioIdOrderByFechaDesc(tutor.getId(), PageRequest.of(0, 10)).isEmpty());

        // Programarla dos veces no corre la fecha
        mockMvc.perform(post(ruta()).header("Authorization", token(tutor)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("ELIMINACION_YA_PROGRAMADA"));
    }

    @Test
    void elTutorCancelaLaEliminacion() throws Exception {
        mockMvc.perform(post(ruta()).header("Authorization", token(tutor))).andExpect(status().isOk());

        mockMvc.perform(delete(ruta()).header("Authorization", token(tutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.eliminacionProgramada").doesNotExist());
        assertNull(proyectoRepository.findById(proyecto.getId()).orElseThrow().getEliminacionProgramada());

        mockMvc.perform(delete(ruta()).header("Authorization", token(tutor)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("ELIMINACION_NO_PROGRAMADA"));
    }

    @Test
    void unMiembroQueNoEsAdminNoPuedeProgramarNiCancelar() throws Exception {
        mockMvc.perform(post(ruta()).header("Authorization", token(docente))).andExpect(status().isForbidden());
        mockMvc.perform(delete(ruta()).header("Authorization", token(docente))).andExpect(status().isForbidden());
        assertNull(proyectoRepository.findById(proyecto.getId()).orElseThrow().getEliminacionProgramada());
    }

    // Criterio de la card: después de la tarea programada el proyecto y sus aportes no existen
    @Test
    void laTareaDiariaBorraElPerfilConSusAportesYArchivos() throws Exception {
        Aporte aporte = aporteRepository.save(Aporte.builder()
                .proyecto(proyecto).autor(docente).tipo(TipoAporte.FORTALEZA)
                .titulo("Arma rompecabezas").contenido("En el aula")
                .datos("{\"contexto\":\"ESCUELA\"}")
                .visibilidad(Visibilidad.TODOS).archivado(false).build());
        Path carpeta = Path.of("target/uploads-eliminacion-test").toAbsolutePath();
        Files.createDirectories(carpeta);
        String ruta = UUID.randomUUID().toString();
        Files.writeString(carpeta.resolve(ruta), "cifrado");
        Archivo archivo = archivoRepository.save(Archivo.builder()
                .proyecto(proyecto).autor(docente).nombreOriginal("pictograma.png")
                .tipoMime("image/png").tamanoBytes(7L).ruta(ruta).fecha(Instant.now()).build());

        // Un perfil que todavía está en su plazo no se toca
        proyecto.setEliminacionProgramada(Instant.now().plus(1, ChronoUnit.DAYS));
        proyectoRepository.save(proyecto);
        eliminacionService.borrarVencidos();
        assertTrue(proyectoRepository.existsById(proyecto.getId()));

        proyecto.setEliminacionProgramada(Instant.now().minus(1, ChronoUnit.MINUTES));
        proyectoRepository.save(proyecto);
        eliminacionService.borrarVencidos();

        assertFalse(proyectoRepository.existsById(proyecto.getId()));
        assertFalse(aporteRepository.existsById(aporte.getId()));
        assertFalse(archivoRepository.existsById(archivo.getId()));
        assertTrue(membresiaRepository.findByProyectoId(proyecto.getId()).isEmpty());
        assertFalse(Files.exists(carpeta.resolve(ruta)), "el archivo cifrado se borra del disco");
    }

    private String ruta() {
        return "/api/proyectos/" + proyecto.getId() + "/eliminacion";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
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
                .usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(esAdmin).build());
    }
}
