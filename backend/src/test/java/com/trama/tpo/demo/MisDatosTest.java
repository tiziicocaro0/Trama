package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.UsuarioRepository;

// Mi perfil: la persona corrige su nombre y apellido. El email no se toca.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MisDatosTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;

    private Usuario usuario() {
        return usuarios.save(Usuario.builder().nombre("Pía").apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("no-se-utiliza-en-estos-tests")
                .tipoCuenta(TipoCuenta.FAMILIA).build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwt.generateToken(usuario.getId());
    }

    @Test
    void corrigeNombreYApellidoSinTocarElEmail() throws Exception {
        Usuario pia = usuario();
        mvc.perform(put("/api/usuarios/yo").header("Authorization", token(pia))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"  Pía Sol \",\"apellido\":\"Gómez\",\"email\":\"otro@trama.test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Pía Sol"))
                .andExpect(jsonPath("$.apellido").value("Gómez"))
                .andExpect(jsonPath("$.email").value(pia.getEmail()));

        Usuario guardado = usuarios.findById(pia.getId()).orElseThrow();
        assertThat(guardado.getNombre()).isEqualTo("Pía Sol");
        assertThat(guardado.getEmail()).isEqualTo(pia.getEmail());
    }

    @Test
    void rechazaDatosVaciosOLargos() throws Exception {
        Usuario pia = usuario();
        mvc.perform(put("/api/usuarios/yo").header("Authorization", token(pia))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"   \",\"apellido\":\"Gómez\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/usuarios/yo").header("Authorization", token(pia))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Pía\",\"apellido\":\"" + "a".repeat(81) + "\"}"))
                .andExpect(status().isBadRequest());
        assertThat(usuarios.findById(pia.getId()).orElseThrow().getNombre()).isEqualTo("Pía");
    }

    @Test
    void sinSesionNoSePuede() throws Exception {
        mvc.perform(put("/api/usuarios/yo").contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Pía\",\"apellido\":\"Gómez\"}"))
                .andExpect(status().is4xxClientError());
    }
}
