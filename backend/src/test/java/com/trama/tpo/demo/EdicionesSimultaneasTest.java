package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;
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

/**
 * Informe de carga 4.2: varias ediciones del mismo aporte a la vez terminaban en deadlock de MySQL
 * y la persona recibía 500. Con el bloqueo de fila al empezar a editar, se guardan una detrás de
 * otra y cada una deja su versión en el historial.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EdicionesSimultaneasTest {

    private static final int EDICIONES = 10;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private AporteVersionRepository aporteVersionRepository;

    private Usuario tutora;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        tutora = crearUsuario("Tutora");
        proyecto = crearProyecto();
        crearMembresia(tutora, proyecto, Rol.TUTOR, true);
    }

    @AfterEach
    void limpiarDatos() {
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());
        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(proyecto.getId(), false));
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.delete(tutora);
    }

    @Test
    void diezEdicionesALaVezSeGuardanTodasYDejanSuVersion() throws Exception {
        String aporteId = crearAporte("TODOS");
        CountDownLatch largada = new CountDownLatch(1);
        ExecutorService hilos = Executors.newFixedThreadPool(EDICIONES);

        try {
            List<Future<Integer>> resultados = new ArrayList<>();
            for (int i = 0; i < EDICIONES; i++) {
                String titulo = "Edicion " + i;
                Callable<Integer> edicion = () -> {
                    largada.await();
                    return mockMvc.perform(put(rutaAportes(proyecto) + "/" + aporteId)
                                    .header("Authorization", token(tutora))
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(aporteJson(titulo, "Contenido de la " + titulo, "TODOS")))
                            .andReturn().getResponse().getStatus();
                };
                resultados.add(hilos.submit(edicion));
            }
            largada.countDown();

            List<Integer> estados = new ArrayList<>();
            for (Future<Integer> resultado : resultados) {
                estados.add(resultado.get(60, TimeUnit.SECONDS));
            }

            assertThat(estados).containsOnly(200);
            assertThat(aporteVersionRepository
                    .findByAporteIdOrderByCreadoEnAsc(UUID.fromString(aporteId)))
                    .hasSize(EDICIONES);
        } finally {
            hilos.shutdownNow();
        }
    }

    private String crearAporte(String visibilidad) throws Exception {

        String json = mockMvc.perform(post(rutaAportes(proyecto))
                .header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON)
                .content(aporteJson("Le gusta dibujar", "Dibuja animales", visibilidad)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        return JsonPath.read(json, "$.id");
    }

    private String aporteJson(String titulo, String contenido, String visibilidad) {
        return """
                {
                  "tipo": "FORTALEZA",
                  "titulo": "%s",
                  "contenido": "%s",
                  "datos": "{\\"contexto\\":\\"ESCUELA\\"}",
                  "visibilidad": "%s"
                }
                """.formatted(titulo, contenido, visibilidad);
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private Proyecto crearProyecto() {
        return proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
    }

    private void crearMembresia(Usuario usuario, Proyecto p, Rol rol, boolean esAdmin) {
        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(p)
                .rol(rol)
                .esAdmin(esAdmin)
                .build());
    }

    private String rutaAportes(Proyecto p) {
        return "/api/proyectos/" + p.getId() + "/aportes";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}
