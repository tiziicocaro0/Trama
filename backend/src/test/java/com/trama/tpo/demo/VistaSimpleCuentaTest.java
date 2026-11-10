package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

// 7.0: la vista simple se guarda en la cuenta, así se mantiene al volver a entrar
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class VistaSimpleCuentaTest {

    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;

    private String token() {
        Usuario usuario = usuarios.save(Usuario.builder().nombre("Elena").apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("no-se-utiliza-en-estos-tests")
                .tipoCuenta(TipoCuenta.FAMILIA).build());
        return "Bearer " + jwt.generateToken(usuario.getId());
    }

    @Test
    void arrancaDesactivadaYQuedaGuardadaAlActivarla() throws Exception {
        String token = token();
        mvc.perform(get("/api/auth/yo").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vistaSimple").value(false));

        mvc.perform(put("/api/usuarios/yo/vista-simple").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"activa\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vistaSimple").value(true));

        // La próxima vez que entra, sigue en vista simple
        mvc.perform(get("/api/auth/yo").header("Authorization", token))
                .andExpect(jsonPath("$.vistaSimple").value(true));
    }

    @Test
    void pideIndicarSiEstaActiva() throws Exception {
        mvc.perform(put("/api/usuarios/yo/vista-simple").header("Authorization", token())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }
}
