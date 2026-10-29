package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AporteVisibilidadPorRolTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutorAutor;
    private Usuario profesionalSalud;
    private Usuario profesionalEducacion;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutorAutor = crearUsuario("Autor");
        profesionalSalud = crearUsuario("Salud");
        profesionalEducacion = crearUsuario("Educacion");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutorAutor, Rol.TUTOR, true);
        crearMembresia(profesionalSalud, Rol.SALUD, false);
        crearMembresia(profesionalEducacion, Rol.EDUCACION, false);
    }

    @AfterEach
    void limpiarDatos() {
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), false));

        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), true));

        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));

        proyectoRepository.delete(proyecto);

        usuarioRepository.deleteAll(List.of(
                tutorAutor, profesionalSalud, profesionalEducacion));
    }

    // 1. VISIBILIDAD SEGÚN EL ROL

    @Test
    void listarAportesRespetaVisibilidadPorRol() throws Exception {
        crearAporteConVisibilidad("Aporte público", Visibilidad.TODOS);
        crearAporteConVisibilidad("Solo tutores", Visibilidad.SOLO_TUTORES);
        crearAporteConVisibilidad("Solo salud", Visibilidad.SOLO_SALUD);
        crearAporteConVisibilidad("Solo educación", Visibilidad.SOLO_EDUCACION);

        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));

        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(profesionalSalud)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Aporte público')]").exists())
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Solo salud')]").exists());

        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(profesionalEducacion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Aporte público')]").exists())
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Solo educación')]").exists());
    }

    // 2. NOTA PROFESIONAL: VISIBILIDAD POR DEFECTO

    @Test
    void notaProfesionalTieneVisibilidadSoloSaludPorDefecto()
            throws Exception {
        String request = """
                {
                  "tipo": "NOTA_PROFESIONAL",
                  "titulo": "Nota de seguimiento",
                  "contenido": "Observación profesional"
                }
                """;

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.visibilidad")
                        .value("SOLO_SALUD"));
    }

    // 3. APORTE COMÚN: VISIBILIDAD POR DEFECTO

    @Test
    void aporteComunTieneVisibilidadTodosPorDefecto()
            throws Exception {
        String request = """
                {
                  "tipo": "FORTALEZA",
                  "titulo": "Le gusta leer",
                  "contenido": "Disfruta los cuentos",
                  "datos": "{\\"contexto\\":\\"CASA\\"}"
                }
                """;

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.visibilidad").value("TODOS"));
    }

    // 4. EDITAR SIN VISIBILIDAD CONSERVA LA ANTERIOR

    @Test
    void editarSinVisibilidadConservaLaAnterior() throws Exception {
        Aporte aporte = crearAporteConVisibilidad(
                "Aporte restringido", Visibilidad.SOLO_TUTORES);

        String request = """
                {
                  "tipo": "FORTALEZA",
                  "titulo": "Aporte actualizado",
                  "contenido": "Nuevo contenido",
                  "datos": "{\\"contexto\\":\\"CASA\\"}"
                }
                """;

        mockMvc.perform(put(rutaAportes() + "/" + aporte.getId())
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.visibilidad")
                        .value("SOLO_TUTORES"));
    }

    // 5. RESUMEN "CONOCELO EN 5 MINUTOS" (2.8)

    @Test
    void resumenFiltraVigentesYVisibilidadPorRolYRechazaAjenoCon403() throws Exception {
        Usuario ajeno = crearUsuario("AjenoResumen");
        try {
            aporteRepository.saveAndFlush(Aporte.builder()
                    .proyecto(proyecto)
                    .autor(tutorAutor)
                    .tipo(TipoAporte.INTERES)
                    .titulo("Trenes")
                    .datos("{\"categoria\":\"TEMA\",\"intensidad\":\"ALTA\"}")
                    .visibilidad(Visibilidad.TODOS)
                    .archivado(false)
                    .build());

            aporteRepository.saveAndFlush(Aporte.builder()
                    .proyecto(proyecto)
                    .autor(tutorAutor)
                    .tipo(TipoAporte.COMUNICACION)
                    .titulo("Usar frases breves")
                    .visibilidad(Visibilidad.SOLO_EDUCACION)
                    .archivado(false)
                    .build());

            aporteRepository.saveAndFlush(Aporte.builder()
                    .proyecto(proyecto)
                    .autor(tutorAutor)
                    .tipo(TipoAporte.DESREGULACION)
                    .titulo("Ofrecer auriculares y lugar silencioso")
                    .visibilidad(Visibilidad.SOLO_SALUD)
                    .archivado(false)
                    .build());

            aporteRepository.saveAndFlush(Aporte.builder()
                    .proyecto(proyecto)
                    .autor(tutorAutor)
                    .tipo(TipoAporte.SENSORIAL)
                    .titulo("Sensibilidad archivada")
                    .visibilidad(Visibilidad.TODOS)
                    .archivado(true)
                    .build());

            String rutaResumen = "/api/proyectos/" + proyecto.getId() + "/resumen";

            mockMvc.perform(get(rutaResumen)
                    .header("Authorization", token(tutorAutor)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.intereses.length()").value(1))
                    .andExpect(jsonPath("$.comunicacion.length()").value(1))
                    .andExpect(jsonPath("$.desregulacion.length()").value(1))
                    .andExpect(jsonPath("$.sensorial.length()").value(0));

            mockMvc.perform(get(rutaResumen)
                    .header("Authorization", token(profesionalEducacion)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.intereses.length()").value(1))
                    .andExpect(jsonPath("$.comunicacion.length()").value(1))
                    .andExpect(jsonPath("$.desregulacion.length()").value(0));

            mockMvc.perform(get(rutaResumen)
                    .header("Authorization", token(ajeno)))
                    .andExpect(status().isForbidden());
        } finally {
            usuarioRepository.delete(ajeno);
        }
    }

    // MÉTODOS AUXILIARES

    private Aporte crearAporteConVisibilidad(
            String titulo, Visibilidad visibilidad) {
        return aporteRepository.saveAndFlush(Aporte.builder()
                .proyecto(proyecto)
                .autor(tutorAutor)
                .tipo(TipoAporte.FORTALEZA)
                .titulo(titulo)
                .contenido("Contenido de prueba")
                .datos("{\"contexto\":\"ESCUELA\"}")
                .visibilidad(visibilidad)
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

    private void crearMembresia(
            Usuario usuario, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
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
