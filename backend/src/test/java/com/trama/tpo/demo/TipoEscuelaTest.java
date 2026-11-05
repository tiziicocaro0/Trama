package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.TipoEscuela;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// Tipo de escuela del niño: común, especial o híbrida.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TipoEscuelaTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;
    @Autowired ProyectoRepository proyectos;
    @Autowired MembresiaRepository membresias;
    private Usuario tutora;

    @BeforeEach
    void preparar() {
        tutora = usuario("Tutora ficticia");
    }

    private Usuario usuario(String nombre) {
        return usuarios.save(Usuario.builder().nombre(nombre).apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("no-se-utiliza-en-estos-tests").build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwt.generateToken(usuario.getId());
    }

    private Map<String, Object> datos(Object tipoEscuela) {
        Map<String, Object> datos = new HashMap<>(Map.of("nombre", "Luz", "apellido", "Ejemplo",
                "fechaNacimiento", "2018-05-12", "escuela", "Escuela ficticia", "grado", "2.º grado",
                "consentimiento", true));
        if (tipoEscuela != null) datos.put("tipoEscuela", tipoEscuela);
        return datos;
    }

    private UUID crear(Object tipoEscuela) throws Exception {
        var resultado = mvc.perform(post("/api/proyectos").header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(datos(tipoEscuela))))
                .andExpect(status().isCreated()).andReturn();
        return UUID.fromString(json.readTree(resultado.getResponse().getContentAsString()).get("id").asText());
    }

    @Test
    void seGuardaAlCrearYVuelveEnElPerfil() throws Exception {
        UUID id = crear("HIBRIDA");
        assertThat(proyectos.findById(id).orElseThrow().getTipoEscuela()).isEqualTo(TipoEscuela.HIBRIDA);
        mvc.perform(get("/api/proyectos/" + id).header("Authorization", token(tutora)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tipoEscuela").value("HIBRIDA"));
    }

    @Test
    void esOpcionalParaNoRomperLosPerfilesAnteriores() throws Exception {
        UUID id = crear(null);
        mvc.perform(get("/api/proyectos/" + id).header("Authorization", token(tutora)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tipoEscuela").doesNotExist());
    }

    @Test
    void unValorQueNoExisteRecibe400() throws Exception {
        long cantidad = proyectos.count();
        mvc.perform(post("/api/proyectos").header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(datos("PRIVADA"))))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"));
        assertThat(proyectos.count()).isEqualTo(cantidad);
    }

    @Test
    void elAdminLoCambiaAlEditarLosDatos() throws Exception {
        UUID id = crear("COMUN");
        Map<String, Object> cambios = datos("ESPECIAL");
        cambios.remove("consentimiento");
        mvc.perform(put("/api/proyectos/" + id).header("Authorization", token(tutora))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(cambios)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tipoEscuela").value("ESPECIAL"));
        assertThat(proyectos.findById(id).orElseThrow().getTipoEscuela()).isEqualTo(TipoEscuela.ESPECIAL);
    }

    @Test
    void unMiembroQueNoEsAdminNoLoPuedeCambiar() throws Exception {
        UUID id = crear("COMUN");
        Usuario familiar = usuario("Familiar ficticio");
        membresias.save(Membresia.builder().proyecto(proyectos.findById(id).orElseThrow())
                .usuario(familiar).rol(Rol.FAMILIAR).esAdmin(false).build());
        Map<String, Object> cambios = datos("ESPECIAL");
        cambios.remove("consentimiento");
        mvc.perform(put("/api/proyectos/" + id).header("Authorization", token(familiar))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(cambios)))
                .andExpect(status().isForbidden());
        assertThat(proyectos.findById(id).orElseThrow().getTipoEscuela()).isEqualTo(TipoEscuela.COMUN);
    }
}
