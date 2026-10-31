package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

// 9.4: al registrarse la persona dice si es familia o profesional (y qué hace).
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TipoDeCuentaTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper json;
    @Autowired private UsuarioRepository usuarioRepository;
    @MockBean private EmailService emailService;

    private final String email = "cuenta." + UUID.randomUUID() + "@example.com";

    @AfterEach
    void limpiarDatos() {
        usuarioRepository.findByEmail(email).ifPresent(usuarioRepository::delete);
    }

    @Test
    void unaFamiliaSeRegistraSinEspecialidades() throws Exception {
        registrar("FAMILIA", "[]").andExpect(status().isCreated());

        yo().andExpect(jsonPath("$.tipoCuenta").value("FAMILIA"))
                .andExpect(jsonPath("$.especialidades").isEmpty());
        miPlan().andExpect(jsonPath("$.esProfesional").value(false));
    }

    @Test
    void unProfesionalDeclaraSusEspecialidadesYVeLosPlanesSinEstarEnNingunNino() throws Exception {
        registrar("PROFESIONAL", "[{\"especialidad\":\"PSICOLOGIA\"},{\"especialidad\":\"DOCENTE_PRIMARIO\"},{\"especialidad\":\"PSICOLOGIA\"}]")
                .andExpect(status().isCreated());

        yo().andExpect(jsonPath("$.tipoCuenta").value("PROFESIONAL"))
                .andExpect(jsonPath("$.especialidades.length()").value(2));
        miPlan().andExpect(jsonPath("$.esProfesional").value(true))
                .andExpect(jsonPath("$.plan").value("GRATUITO"));
    }

    @Test
    void unProfesionalSinEspecialidadRecibeUnErrorClaro() throws Exception {
        registrar("PROFESIONAL", "[]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("ESPECIALIDAD_REQUERIDA"));
    }

    @Test
    void unaFamiliaNoDeclaraEspecialidades() throws Exception {
        registrar("FAMILIA", "[{\"especialidad\":\"PSICOLOGIA\"}]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("ESPECIALIDAD_SOLO_PROFESIONAL"));
    }

    @Test
    void siEligeOtraTieneQueContarQueHace() throws Exception {
        registrar("PROFESIONAL", "[{\"especialidad\":\"OTRA_SALUD\",\"aclaracion\":\" \"}]")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("ACLARACION_REQUERIDA"));

        registrar("PROFESIONAL", "[{\"especialidad\":\"OTRA_SALUD\",\"aclaracion\":\"Musicoterapeuta\"}]")
                .andExpect(status().isCreated());
        yo().andExpect(jsonPath("$.especialidades[0].especialidad").value("OTRA_SALUD"))
                .andExpect(jsonPath("$.especialidades[0].aclaracion").value("Musicoterapeuta"));
    }

    @Test
    void elTipoDeCuentaEsObligatorioYTieneQueExistir() throws Exception {
        registrar(null, "[]").andExpect(status().isBadRequest());
        registrar("DOCENTE", "[]").andExpect(status().isBadRequest());
        registrar("PROFESIONAL", "[{\"especialidad\":\"ASTROLOGIA\"}]").andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------

    private ResultActions registrar(String tipoCuenta, String especialidades) throws Exception {
        String tipo = tipoCuenta == null ? "" : "\"tipoCuenta\":\"" + tipoCuenta + "\",";
        return mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{" + tipo + "\"nombre\":\"Ana\",\"apellido\":\"Prueba\",\"email\":\"" + email
                        + "\",\"password\":\"Prueba123!\",\"especialidades\":" + especialidades + "}"));
    }

    private ResultActions yo() throws Exception {
        return mockMvc.perform(get("/api/auth/yo").header("Authorization", token()))
                .andExpect(status().isOk());
    }

    private ResultActions miPlan() throws Exception {
        return mockMvc.perform(get("/api/suscripcion").header("Authorization", token()))
                .andExpect(status().isOk());
    }

    private String token() throws Exception {
        // Simula que ya confirmó el código del mail.
        var usuario = usuarioRepository.findByEmail(email).orElseThrow();
        usuario.setEmailVerificado(true);
        usuarioRepository.save(usuario);
        String respuesta = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Prueba123!\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + json.readTree(respuesta).get("access_token").asText();
    }
}
