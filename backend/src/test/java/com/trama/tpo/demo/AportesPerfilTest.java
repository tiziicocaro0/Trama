package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.*;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.*;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test") @Transactional
class AportesPerfilTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;
    @Autowired ProyectoRepository proyectos;
    @Autowired MembresiaRepository membresias;
    @Autowired AporteRepository aportes;
    @Autowired AporteVersionRepository versiones;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entityManager;
    private Proyecto proyecto;
    private Usuario tutor, cotutor, salud, docente, familiar, ajeno;

    @BeforeEach
    void preparar() {
        proyecto = proyecto();
        tutor = usuario("Tutora ficticia");
        cotutor = usuario("Cotutor ficticio");
        salud = usuario("Salud ficticio");
        docente = usuario("Docente ficticia");
        familiar = usuario("Familiar ficticio");
        ajeno = usuario("Ajeno ficticio");
        vincular(tutor, proyecto, Rol.TUTOR);
        vincular(cotutor, proyecto, Rol.TUTOR);
        vincular(salud, proyecto, Rol.SALUD);
        vincular(docente, proyecto, Rol.EDUCACION);
        vincular(familiar, proyecto, Rol.FAMILIAR);
    }

    private Proyecto proyecto() {
        return proyectos.save(Proyecto.builder().nombre("Niño ficticio").apellido("Ejemplo")
                .fechaNacimiento(LocalDate.of(2018, 5, 12)).escuela("Escuela ficticia").grado("2.º")
                .consentimientoFecha(Instant.now()).build());
    }
    private Usuario usuario(String nombre) {
        return usuarios.save(Usuario.builder().nombre(nombre).apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("solo-tests").build());
    }
    private void vincular(Usuario usuario, Proyecto destino, Rol rol) {
        membresias.saveAndFlush(Membresia.builder().usuario(usuario).proyecto(destino).rol(rol).build());
    }
    private String token(Usuario usuario) { return "Bearer " + jwt.generateToken(usuario.getId()); }
    private String ruta() { return "/api/proyectos/" + proyecto.getId() + "/aportes"; }
    private String datos(String tipo, String titulo, String contenido, String visibilidad) throws Exception {
        return json.writeValueAsString(Map.of("tipo", tipo, "titulo", titulo, "contenido", contenido, "visibilidad", visibilidad));
    }
    private UUID crear(Usuario autor, String tipo, String visibilidad) throws Exception {
        String respuesta = mvc.perform(post(ruta()).header("Authorization", token(autor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos(tipo, "Título ficticio", "Contenido ficticio original", visibilidad)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return UUID.fromString(json.readTree(respuesta).get("id").asText());
    }
    private byte[] binario(UUID id) {
        return ByteBuffer.allocate(16).putLong(id.getMostSignificantBits()).putLong(id.getLeastSignificantBits()).array();
    }

    @Test
    void creaLasSeisSeccionesYListaDatosReales() throws Exception {
        for (TipoAporte tipo : new TipoAporte[] { TipoAporte.FORTALEZA, TipoAporte.INTERES,
                TipoAporte.COMUNICACION, TipoAporte.SENSORIAL, TipoAporte.ESTRATEGIA, TipoAporte.RUTINA }) {
            crear(tutor, tipo.name(), "TODOS");
        }
        mvc.perform(get(ruta()).header("Authorization", token(tutor))).andExpect(status().isOk())
                .andExpect(jsonPath("$.aportes.length()").value(6)).andExpect(jsonPath("$.puedeCrear").value(true))
                .andExpect(jsonPath("$.aportes[0].contenido").value("Contenido ficticio original"))
                .andExpect(jsonPath("$.aportes[0].puedeEditar").value(true));
    }

    @Test
    void guardaNotasConFechaDelServidorYSoloPermiteEditarAlAutor() throws Exception {
        Instant antes = Instant.now();
        var solicitud = json.readTree(datos("NOTA", "Nota ficticia", "Texto de nota ficticia", "TODOS"));
        ((com.fasterxml.jackson.databind.node.ObjectNode) solicitud).put("creadoEn", "1900-01-01T00:00:00Z");
        var respuesta = mvc.perform(post(ruta()).header("Authorization", token(tutor)).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(solicitud))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.tipo").value("NOTA")).andReturn().getResponse().getContentAsString();
        var nota = json.readTree(respuesta);
        UUID id = UUID.fromString(nota.get("id").asText());
        Instant creada = Instant.parse(nota.get("creadoEn").asText());
        assertThat(creada).isBetween(antes, Instant.now());
        assertThat(nota.get("actualizadoEn").asText()).isEqualTo(nota.get("creadoEn").asText());
        mvc.perform(put(ruta() + "/" + id).header("Authorization", token(cotutor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("NOTA", "Otro título", "Otra nota", "TODOS"))).andExpect(status().isForbidden());
        var editada = mvc.perform(put(ruta() + "/" + id).header("Authorization", token(tutor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("NOTA", "Nota editada", "Texto ficticio editado", "TODOS")))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var guardada = json.readTree(editada);
        assertThat(guardada.get("creadoEn").asText()).isEqualTo(nota.get("creadoEn").asText());
        assertThat(Instant.parse(guardada.get("actualizadoEn").asText())).isAfterOrEqualTo(creada);
        assertThat(versiones.findByAporteIdOrderByCreadoEnAsc(id)).hasSize(1);
        mvc.perform(get(ruta()).header("Authorization", token(tutor)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.aportes[0].tipo").value("NOTA"))
                .andExpect(jsonPath("$.aportes[0].contenido").value("Texto ficticio editado"));
    }

    @Test
    void editaSoloElAutorYConservaUnaVersionCifradaDelContenidoAnterior() throws Exception {
        UUID id = crear(tutor, "FORTALEZA", "TODOS");
        mvc.perform(put(ruta() + "/" + id).header("Authorization", token(cotutor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("FORTALEZA", "Otro título", "Otra descripción", "TODOS"))).andExpect(status().isForbidden());
        assertThat(versiones.findByAporteIdOrderByCreadoEnAsc(id)).isEmpty();
        mvc.perform(put(ruta() + "/" + id).header("Authorization", token(tutor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("FORTALEZA", "Título editado", "Descripción ficticia editada", "SOLO_TUTORES")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.titulo").value("Título editado"));
        aportes.flush();
        var historial = versiones.findByAporteIdOrderByCreadoEnAsc(id);
        assertThat(historial).hasSize(1);
        assertThat(historial.get(0).getContenido()).isEqualTo("Contenido ficticio original");
        assertThat(historial.get(0).getTitulo()).isEqualTo("Título ficticio");
        byte[] actual = jdbc.queryForObject("select contenido from aporte where id = ?", byte[].class, binario(id));
        byte[] anterior = jdbc.queryForObject("select contenido from aporte_version where aporte_id = ?", byte[].class, binario(id));
        assertThat(new String(actual, StandardCharsets.UTF_8)).doesNotContain("Descripción ficticia editada");
        assertThat(new String(anterior, StandardCharsets.UTF_8)).doesNotContain("Contenido ficticio original");
    }

    @Test
    void filtraVisibilidadPorRolEnLaConsultaYNoExponeAportesDeOtroProyecto() throws Exception {
        for (Visibilidad visibilidad : Visibilidad.values()) crear(tutor, "INTERES", visibilidad.name());
        for (var acceso : Map.of(tutor, 4, salud, 2, docente, 2, familiar, 1).entrySet()) {
            mvc.perform(get(ruta()).header("Authorization", token(acceso.getKey()))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.aportes.length()").value(acceso.getValue()));
        }
        var otro = proyecto();
        mvc.perform(get("/api/proyectos/" + otro.getId() + "/aportes").header("Authorization", token(tutor)))
                .andExpect(status().isForbidden());
        mvc.perform(get(ruta()).header("Authorization", token(docente)))
                .andExpect(jsonPath("$.aportes[0].puedeEditar").value(false));
    }

    @Test
    void unAjenoNoPuedeLeerCrearNiEditarYNecesitaSesion() throws Exception {
        UUID id = crear(tutor, "COMUNICACION", "TODOS");
        mvc.perform(get(ruta()).header("Authorization", token(ajeno))).andExpect(status().isForbidden());
        mvc.perform(post(ruta()).header("Authorization", token(ajeno)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("COMUNICACION", "Ejemplo", "Descripción", "TODOS"))).andExpect(status().isForbidden());
        mvc.perform(put(ruta() + "/" + id).header("Authorization", token(ajeno)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("COMUNICACION", "Ejemplo", "Descripción", "TODOS"))).andExpect(status().isForbidden());
        mvc.perform(get(ruta())).andExpect(status().isUnauthorized());
        mvc.perform(post(ruta()).contentType(MediaType.APPLICATION_JSON).content(datos("COMUNICACION", "Ejemplo", "", "TODOS")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void familiarEnSoloLecturaNoCreaNiEditaPeroPuedeConsultar() throws Exception {
        UUID id = crear(familiar, "RUTINA", "TODOS");
        proyecto.setFamiliarPuedeCargar(false);
        proyectos.saveAndFlush(proyecto);
        mvc.perform(get(ruta()).header("Authorization", token(familiar)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.puedeCrear").value(false))
                .andExpect(jsonPath("$.aportes[0].puedeEditar").value(false));
        mvc.perform(post(ruta()).header("Authorization", token(familiar)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("RUTINA", "Ejemplo", "", "TODOS"))).andExpect(status().isForbidden());
        mvc.perform(put(ruta() + "/" + id).header("Authorization", token(familiar)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("RUTINA", "Ejemplo", "", "TODOS"))).andExpect(status().isForbidden());
    }

    @Test
    void profesionalRespetaElLimiteDeDosProyectosEditables() throws Exception {
        UUID id = crear(docente, "ESTRATEGIA", "TODOS");
        var primerProyecto = proyecto();
        var segundoProyecto = proyecto();
        vincular(docente, primerProyecto, Rol.EDUCACION);
        vincular(docente, segundoProyecto, Rol.SALUD);
        entityManager.flush();

        // fechaAlta es inmutable para JPA. El fixture fija fechas distintas en la base
        // para que el orden no dependa del reloj ni del desempate por UUID.
        for (var alta : Map.of(primerProyecto.getId(), "2020-01-01T12:00:00Z",
                segundoProyecto.getId(), "2020-01-02T12:00:00Z",
                proyecto.getId(), "2020-01-03T12:00:00Z").entrySet()) {
            assertThat(jdbc.update("update membresia set fecha_alta = ? where usuario_id = ? and proyecto_id = ?",
                    Timestamp.from(Instant.parse(alta.getValue())), binario(docente.getId()), binario(alta.getKey())))
                    .isEqualTo(1);
        }
        entityManager.clear();
        assertThat(membresias.findByUsuarioIdAndRolInOrderByFechaAltaAscIdAsc(
                docente.getId(), Set.of(Rol.EDUCACION, Rol.SALUD)))
                .extracting(membresia -> membresia.getProyecto().getId())
                .containsExactly(primerProyecto.getId(), segundoProyecto.getId(), proyecto.getId());

        for (var editable : new Proyecto[] { primerProyecto, segundoProyecto }) {
            String rutaEditable = "/api/proyectos/" + editable.getId() + "/aportes";
            mvc.perform(get(rutaEditable).header("Authorization", token(docente))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.puedeCrear").value(true));
            mvc.perform(post(rutaEditable).header("Authorization", token(docente)).contentType(MediaType.APPLICATION_JSON)
                    .content(datos("ESTRATEGIA", "Ejemplo", "", "TODOS"))).andExpect(status().isCreated());
        }
        mvc.perform(get(ruta()).header("Authorization", token(docente))).andExpect(status().isOk())
                .andExpect(jsonPath("$.puedeCrear").value(false))
                .andExpect(jsonPath("$.aportes[0].puedeEditar").value(false));
        mvc.perform(post(ruta()).header("Authorization", token(docente)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("ESTRATEGIA", "Ejemplo", "", "TODOS"))).andExpect(status().isForbidden());
        mvc.perform(put(ruta() + "/" + id).header("Authorization", token(docente)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("ESTRATEGIA", "Ejemplo", "", "TODOS"))).andExpect(status().isForbidden());
        for (Usuario miembroSinLimiteProfesional : new Usuario[] { tutor, familiar }) {
            mvc.perform(get(ruta()).header("Authorization", token(miembroSinLimiteProfesional)))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.puedeCrear").value(true));
        }
    }

    @Test
    void validaEntradaYNoPermiteMoverUnAporteDeSeccion() throws Exception {
        for (String entrada : new String[] { datos("FORTALEZA", " ", "", "TODOS"),
                datos("FORTALEZA", "x".repeat(151), "", "TODOS"), datos("FORTALEZA", "Ejemplo", "x".repeat(10001), "TODOS"),
                datos("INVALIDO", "Ejemplo", "", "TODOS"), datos("FORTALEZA", "Ejemplo", "", "INVALIDO"), "{}" }) {
            mvc.perform(post(ruta()).header("Authorization", token(tutor)).contentType(MediaType.APPLICATION_JSON).content(entrada))
                    .andExpect(status().isBadRequest());
        }
        UUID id = crear(tutor, "FORTALEZA", "TODOS");
        mvc.perform(put(ruta() + "/" + id).header("Authorization", token(tutor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("INTERES", "Ejemplo", "", "TODOS"))).andExpect(status().isBadRequest());
        assertThat(versiones.findByAporteIdOrderByCreadoEnAsc(id)).isEmpty();
        mvc.perform(put(ruta() + "/" + UUID.randomUUID()).header("Authorization", token(tutor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("FORTALEZA", "Ejemplo", "", "TODOS"))).andExpect(status().isNotFound());
    }

    @Test
    void noListaNiEditaArchivadosYOrdenaPorCreacionDescendente() throws Exception {
        UUID antiguo = crear(tutor, "SENSORIAL", "TODOS");
        UUID reciente = crear(tutor, "SENSORIAL", "TODOS");
        Aporte aporte = aportes.findById(antiguo).orElseThrow();
        aporte.setArchivado(true);
        aportes.saveAndFlush(aporte);
        mvc.perform(get(ruta()).header("Authorization", token(tutor)))
                .andExpect(jsonPath("$.aportes.length()").value(1)).andExpect(jsonPath("$.aportes[0].id").value(reciente.toString()));
        mvc.perform(put(ruta() + "/" + antiguo).header("Authorization", token(tutor)).contentType(MediaType.APPLICATION_JSON)
                .content(datos("SENSORIAL", "Ejemplo", "", "TODOS"))).andExpect(status().isNotFound());
    }
}
