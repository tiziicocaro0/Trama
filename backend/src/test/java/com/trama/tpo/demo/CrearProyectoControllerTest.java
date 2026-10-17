package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class CrearProyectoControllerTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;
    @Autowired ProyectoRepository proyectos;
    @Autowired MembresiaRepository membresias;
    private Usuario creador;
    private Usuario ajeno;

    @BeforeEach
    void preparar() {
        creador = usuario("Tutora ficticia");
        ajeno = usuario("Ajeno ficticio");
    }

    private Usuario usuario(String nombre) {
        return usuarios.save(Usuario.builder().nombre(nombre).apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("no-se-utiliza-en-estos-tests").build());
    }

    private Map<String, Object> datos() {
        return new HashMap<>(Map.of("nombre", " Luz ", "apellido", "Ejemplo", "apodo", "Luli",
                "fechaNacimiento", "2018-05-12", "escuela", "Escuela ficticia", "grado", "2.º", "consentimiento", true));
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwt.generateToken(usuario.getId());
    }

    @Test
    void creaProyectoYLoListaConElCreadorComoTutorAdmin() throws Exception {
        var resultado = mvc.perform(post("/api/proyectos").header("Authorization", token(creador))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(datos())))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.nombre").value("Luz"))
                .andExpect(jsonPath("$.fechaNacimiento").value("2018-05-12")).andReturn();
        UUID id = UUID.fromString(json.readTree(resultado.getResponse().getContentAsString()).get("id").asText());
        assertThat(resultado.getResponse().getHeader("Location")).isEqualTo("/api/proyectos/" + id);
        var membresia = membresias.findByUsuarioIdAndProyectoId(creador.getId(), id).orElseThrow();
        assertThat(membresia.getRol()).isEqualTo(Rol.TUTOR);
        assertThat(membresia.getEsAdmin()).isTrue();
        assertThat(proyectos.findById(id).orElseThrow().getConsentimientoFecha()).isNotNull();
        mvc.perform(get("/api/proyectos").header("Authorization", token(creador)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].rol").value("TUTOR")).andExpect(jsonPath("$[0].esAdmin").value(true));
        mvc.perform(get("/api/proyectos/" + id).header("Authorization", token(creador)))
                .andExpect(status().isOk());
        mvc.perform(put("/api/proyectos/" + id + "/configuracion").header("Authorization", token(creador))
                .contentType(MediaType.APPLICATION_JSON).content("{\"familiarPuedeCargar\":false,\"familiarVeNotas\":true}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/proyectos/" + id).header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/proyectos").header("Authorization", token(ajeno)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void requiereSesion() throws Exception {
        long cantidad = proyectos.count();
        mvc.perform(post("/api/proyectos").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(datos()))).andExpect(status().isUnauthorized());
        assertThat(proyectos.count()).isEqualTo(cantidad);
    }

    @Test
    void rechazaDatosInvalidosSinGuardarProyectoNiMembresia() throws Exception {
        long cantidad = proyectos.count();
        long cantidadMembresias = membresias.count();
        for (var invalido : Map.<String, Object>of("nombre", " ", "apellido", "x".repeat(81),
                "apodo", "x".repeat(41), "fechaNacimiento", LocalDate.now().plusDays(1).toString(),
                "escuela", "", "grado", "x".repeat(31), "consentimiento", false).entrySet()) {
            var datos = datos();
            datos.put(invalido.getKey(), invalido.getValue());
            mvc.perform(post("/api/proyectos").header("Authorization", token(creador))
                    .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(datos)))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"));
        }
        mvc.perform(post("/api/proyectos").header("Authorization", token(creador))
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        assertThat(proyectos.count()).isEqualTo(cantidad);
        assertThat(membresias.count()).isEqualTo(cantidadMembresias);
    }
}
