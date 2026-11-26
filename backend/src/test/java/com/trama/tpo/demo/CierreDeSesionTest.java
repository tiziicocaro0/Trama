package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.UsuarioRepository;

// Cerrar sesión invalida el token en el servidor, no solo en el navegador:
// un JWT robado o copiado deja de servir aunque todavía no haya vencido.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CierreDeSesionTest {

    private static final String CONTRASENA = "Contrasena-de-prueba-1";

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;
    @Autowired ObjectMapper mapper;

    private String crearUsuario() {
        String email = "sesion." + UUID.randomUUID() + "@trama.test";
        usuarios.save(Usuario.builder().nombre("Laura").apellido("Ejemplo").email(email)
                .passwordHash(encoder.encode(CONTRASENA)).tipoCuenta(TipoCuenta.FAMILIA)
                .emailVerificado(true).build());
        return email;
    }

    private String ingresar(String email) throws Exception {
        String respuesta = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + CONTRASENA + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + mapper.readTree(respuesta).path("access_token").asText();
    }

    @Test
    void despuesDeCerrarSesionElMismoTokenYaNoSirve() throws Exception {
        String token = ingresar(crearUsuario());
        mvc.perform(get("/api/auth/yo").header("Authorization", token)).andExpect(status().isOk());

        mvc.perform(post("/api/auth/salir").header("Authorization", token)).andExpect(status().isNoContent());

        mvc.perform(get("/api/auth/yo").header("Authorization", token)).andExpect(status().isUnauthorized());
    }

    @Test
    void cerrarSesionCierraTodosLosDispositivosYSePuedeVolverAEntrar() throws Exception {
        String email = crearUsuario();
        String celular = ingresar(email);
        String computadora = ingresar(email);

        mvc.perform(post("/api/auth/salir").header("Authorization", computadora)).andExpect(status().isNoContent());

        mvc.perform(get("/api/auth/yo").header("Authorization", celular)).andExpect(status().isUnauthorized());
        String nuevo = ingresar(email);
        mvc.perform(get("/api/auth/yo").header("Authorization", nuevo)).andExpect(status().isOk());
        assertThat(usuarios.findByEmail(email).orElseThrow().getTokenVersion()).isEqualTo(1);
    }

    @Test
    void sinSesionNoSePuedeCerrar() throws Exception {
        mvc.perform(post("/api/auth/salir")).andExpect(status().isUnauthorized());
    }
}
