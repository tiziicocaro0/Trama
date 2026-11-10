
package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ComentarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

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

    @Autowired
    private NotificacionRepository notificacionRepository;

    private Usuario tutora;
    private Usuario familiar;
    private Proyecto proyecto;

    // PREPARAR DATOS DE PRUEBA
    @BeforeEach
    void prepararDatos() {

        tutora = crearUsuario("Tutora");
        familiar = crearUsuario("Familiar");

        proyecto = proyectoRepository.save(
                Proyecto.builder()
                        .nombre("Niño")
                        .apellido("Prueba")
                        .fechaNacimiento(LocalDate.of(2017, 1, 1))
                        .escuela("Escuela de prueba")
                        .grado("3.º grado")
                        .consentimientoFecha(Instant.now())
                        .build()
        );

        crearMembresia(tutora, Rol.TUTOR, true);
        crearMembresia(familiar, Rol.FAMILIAR, false);
    }

    // LIMPIAR DATOS DE PRUEBA
    @AfterEach
    void limpiarDatos() {

        // Eliminar primero las notificaciones.
        // Pueden tener referencias al proyecto y a los usuarios.
        eliminarNotificaciones(tutora);
        eliminarNotificaciones(familiar);

        // Eliminar las versiones antes de borrar aportes.
        aporteVersionRepository.eliminarPorProyectoId(
                proyecto.getId()
        );

        // Los comentarios se eliminan automáticamente
        // al eliminar sus aportes (ON DELETE CASCADE).
        for (boolean archivado : List.of(false, true)) {

            aporteRepository.deleteAll(
                    aporteRepository
                            .findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                                    proyecto.getId(),
                                    archivado
                            )
            );
        }

        // Eliminar membresías, proyecto y usuarios.
        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(
                        proyecto.getId()
                )
        );

        proyectoRepository.delete(proyecto);

        usuarioRepository.deleteAll(
                List.of(tutora, familiar)
        );
    }

    // PRUEBA 1: CREAR Y LEER COMENTARIOS
    @Test
    void unMiembroPuedeCrearYLeerComentarios() throws Exception {

        UUID aporteId = crearAporte("TODOS");

        comentar(
                familiar,
                aporteId,
                "Hoy observé una mejora"
        )
                .andExpect(status().isCreated())
                .andExpect(
                        jsonPath("$.texto")
                                .value("Hoy observé una mejora")
                )
                .andExpect(
                        jsonPath("$.autorNombre")
                                .value("Familiar Prueba")
                )
                .andExpect(
                        jsonPath("$.aporteId")
                                .value(aporteId.toString())
                )
                .andExpect(
                        jsonPath("$.fecha").exists()
                );

        // La tutora también puede leer el comentario.
        mockMvc.perform(
                        get(rutaComentarios(aporteId))
                                .header(
                                        "Authorization",
                                        token(tutora)
                                )
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.length()").value(1)
                )
                .andExpect(
                        jsonPath("$[0].texto")
                                .value("Hoy observé una mejora")
                )
                .andExpect(
                        jsonPath("$[0].autorNombre")
                                .value("Familiar Prueba")
                );
    }

    // 6.2: el listado de aportes trae cuántos comentarios tiene cada uno
    @Test
    void elListadoDeAportesTraeLaCantidadDeComentarios() throws Exception {

        UUID aporteId = crearAporte("TODOS");
        comentar(familiar, aporteId, "Primer comentario").andExpect(status().isCreated());
        comentar(tutora, aporteId, "Segundo comentario").andExpect(status().isCreated());

        mockMvc.perform(
                        get("/api/proyectos/{id}/aportes", proyecto.getId())
                                .header("Authorization", token(tutora))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(aporteId.toString()))
                .andExpect(jsonPath("$[0].comentarios").value(2));
    }

    // PRUEBA 2: EL TEXTO SE ALMACENA CIFRADO
    @Test
    void elComentarioSeGuardaCifrado() throws Exception {

        UUID aporteId = crearAporte("TODOS");

        String texto = "Información privada de prueba";

        String respuesta = comentar(
                familiar,
                aporteId,
                texto
        )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(respuesta);

        UUID comentarioId = UUID.fromString(
                json.get("id").asText()
        );

        // Leer los bytes reales almacenados en MySQL.
        byte[] textoGuardado = jdbcTemplate.queryForObject(
                """
                SELECT texto
                FROM comentario
                WHERE id = UNHEX(REPLACE(?, '-', ''))
                """,
                byte[].class,
                comentarioId.toString()
        );

        assertThat(textoGuardado).isNotNull();

        // AES-GCM agrega 28 bytes: IV + tag.
        assertThat(textoGuardado)
                .hasSize(
                        texto.getBytes(StandardCharsets.UTF_8).length
                                + 28
                );

        // El valor almacenado no es el texto original.
        assertThat(textoGuardado)
                .isNotEqualTo(
                        texto.getBytes(StandardCharsets.UTF_8)
                );
    }

    // PRUEBA 3: RESPETAR VISIBILIDAD DEL APORTE
    @Test
    void unFamiliarNoPuedeComentarNiLeerUnAportePrivado()
            throws Exception {

        UUID aporteId = crearAporte("SOLO_SALUD");

        comentar(
                familiar,
                aporteId,
                "Comentario no permitido"
        )
                .andExpect(status().isForbidden());

        mockMvc.perform(
                        get(rutaComentarios(aporteId))
                                .header(
                                        "Authorization",
                                        token(familiar)
                                )
                )
                .andExpect(status().isForbidden());
    }

    // PRUEBA 4: BLOQUEAR USUARIOS AJENOS AL PROYECTO
    @Test
    void unUsuarioAjenoAlProyectoNoPuedeAcceder()
            throws Exception {

        UUID aporteId = crearAporte("TODOS");

        Usuario ajeno = crearUsuario("Ajeno");

        try {

            comentar(
                    ajeno,
                    aporteId,
                    "Comentario ajeno"
            )
                    .andExpect(status().isForbidden());

            mockMvc.perform(
                            get(rutaComentarios(aporteId))
                                    .header(
                                            "Authorization",
                                            token(ajeno)
                                    )
                    )
                    .andExpect(status().isForbidden());

        } finally {

            usuarioRepository.delete(ajeno);
        }
    }

    // PRUEBA 5: NO COMENTAR APORTES ARCHIVADOS
    @Test
    void noSePuedeComentarUnAporteArchivado()
            throws Exception {

        UUID aporteId = crearAporte("TODOS");

        // Archivar el aporte.
        mockMvc.perform(
                        post(rutaAportes() + "/" + aporteId + "/archivar")
                                .header(
                                        "Authorization",
                                        token(tutora)
                                )
                )
                .andExpect(status().isNoContent());

        // Intentar publicar un comentario nuevo.
        comentar(
                familiar,
                aporteId,
                "Comentario nuevo"
        )
                .andExpect(status().isConflict())
                .andExpect(
                        jsonPath("$.codigo")
                                .value("APORTE_ARCHIVADO")
                );
    }

    // PRUEBA 6: RECHAZAR COMENTARIOS VACÍOS
    @Test
    void noSePermitenComentariosVacios()
            throws Exception {

        UUID aporteId = crearAporte("TODOS");

        comentar(
                familiar,
                aporteId,
                "   "
        )
                .andExpect(status().isBadRequest());
    }

    // PRUEBA 7: INTEGRACIÓN REAL DE MENCIONES
    @Test
    void mencionarAUnMiembroCreaUnaNotificacionReal()
            throws Exception {

        // La tutora crea un aporte visible para todos.
        UUID aporteId = crearAporte("TODOS");

        // Publica un comentario mencionando dos veces
        // a la misma familiar.
        comentar(
                tutora,
                aporteId,
                "@Familiar, ¿podés revisar esto? Gracias, @Familiar."
        )
                .andExpect(status().isCreated());

        // Consultar las notificaciones guardadas
        // realmente en MySQL para la familiar.
        var notificaciones = notificacionRepository
                .findByUsuarioIdOrderByFechaDesc(
                        familiar.getId(),
                        PageRequest.of(0, 10)
                );

        // Dos menciones en un mismo comentario
        // deben generar una sola notificación.
        assertThat(notificaciones).hasSize(1);

        var notificacion = notificaciones.get(0);

        // Verificar tipo de notificación.
        assertThat(notificacion.getTipo())
                .isEqualTo("MENCION");

        // Verificar mensaje genérico,
        // sin incluir el contenido privado.
        assertThat(notificacion.getTexto())
                .isEqualTo(
                        "Te mencionaron en un comentario."
                );

        // Verificar enlace al perfil del proyecto.
        assertThat(notificacion.getLink())
                .isEqualTo(
                        "/proyectos/" + proyecto.getId()
                );

        // La notificación debe comenzar sin leer.
        assertThat(
                notificacionRepository
                        .countByUsuarioIdAndLeidaFalse(
                                familiar.getId()
                        )
        ).isEqualTo(1L);

        // El autor del comentario no recibe
        // ninguna notificación por esta acción.
        var avisosTutora = notificacionRepository
                .findByUsuarioIdOrderByFechaDesc(
                        tutora.getId(),
                        PageRequest.of(0, 10)
                );

        assertThat(avisosTutora).isEmpty();
    }

    // ---------- MÉTODOS AUXILIARES ----------

    // CREAR UN APORTE DE PRUEBA
    private UUID crearAporte(String visibilidad)
            throws Exception {

        String respuesta = mockMvc.perform(
                        post(rutaAportes())
                                .header(
                                        "Authorization",
                                        token(tutora)
                                )
                                .contentType(
                                        MediaType.APPLICATION_JSON
                                )
                                .content(
                                        """
                                        {
                                          "tipo": "FORTALEZA",
                                          "titulo": "Le gusta dibujar",
                                          "contenido": "Texto de prueba",
                                          "datos": "{\\"contexto\\":\\"ESCUELA\\"}",
                                          "visibilidad": "%s"
                                        }
                                        """.formatted(visibilidad)
                                )
                )
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return UUID.fromString(
                objectMapper.readTree(respuesta)
                        .get("id")
                        .asText()
        );
    }

    // PUBLICAR COMENTARIO MEDIANTE POST
    private ResultActions comentar(
            Usuario usuario,
            UUID aporteId,
            String texto) throws Exception {

        return mockMvc.perform(
                post(rutaComentarios(aporteId))
                        .header(
                                "Authorization",
                                token(usuario)
                        )
                        .contentType(
                                MediaType.APPLICATION_JSON
                        )
                        .content(
                                objectMapper.writeValueAsString(
                                        Map.of("texto", texto)
                                )
                        )
        );
    }

    // CREAR USUARIO DE PRUEBA
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
                        .passwordHash(
                                "no-se-usa-en-estos-tests"
                        )
                        .build()
        );
    }

    // CREAR MEMBRESÍA DE PRUEBA
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

    // ELIMINAR NOTIFICACIONES DEL USUARIO DE PRUEBA
    private void eliminarNotificaciones(Usuario usuario) {

        notificacionRepository.deleteAll(
                notificacionRepository
                        .findByUsuarioIdOrderByFechaDesc(
                                usuario.getId(),
                                PageRequest.of(0, 100)
                        )
        );
    }

    // RUTAS DE LA API
    private String rutaAportes() {

        return "/api/proyectos/"
                + proyecto.getId()
                + "/aportes";
    }

    private String rutaComentarios(UUID aporteId) {

        return rutaAportes()
                + "/"
                + aporteId
                + "/comentarios";
    }

    // TOKEN JWT DEL USUARIO
    private String token(Usuario usuario) {

        return "Bearer "
                + jwtService.generateToken(
                        usuario.getId()
                );
    }
}
