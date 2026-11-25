package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.exceptions.GlobalExceptionHandler;
import com.trama.tpo.demo.exceptions.GlobalExceptionHandler.ErrorResponse;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Los errores dicen qué falló y qué se esperaba, y los inesperados quedan en el log con un código
 * de seguimiento (hallazgo C3 del informe de carga). Se prueban sobre endpoints públicos reales.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ErroresClarosTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void unaValidacionDiceQueCamposFallaronYPorQue() throws Exception {
        String registro = """
                {"nombre": "", "apellido": "Pérez", "email": "no-es-un-email",
                 "password": "Clave123!", "tipoCuenta": "FAMILIA"}
                """;

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"))
                .andExpect(jsonPath("$.campos[?(@.campo == 'nombre')].mensaje")
                        .value("El nombre es obligatorio"))
                .andExpect(jsonPath("$.campos[?(@.campo == 'email')].mensaje")
                        .value("El formato del email no es válido"))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.startsWith("Revisá estos datos: ")))
                .andExpect(jsonPath("$.seguimiento").doesNotExist());
    }

    @Test
    void unValorQueNoExisteEnLaListaNombraLosValoresPosibles() throws Exception {
        String registro = """
                {"nombre": "Ana", "apellido": "Pérez", "email": "ana@example.com",
                 "password": "Clave123!", "tipoCuenta": "DOCENTE"}
                """;

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registro))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("DATOS_INVALIDOS"))
                .andExpect(jsonPath("$.mensaje").value(
                        "El valor \"DOCENTE\" no es válido para \"tipoCuenta\". Valores posibles: FAMILIA, PROFESIONAL"));
    }

    @Test
    void unJsonMalFormadoLoDiceSinDetallesInternos() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value("El cuerpo del pedido no es un JSON válido o está vacío"));
    }

    @Test
    void unMetodoNoPermitidoEs405YNo500() throws Exception {
        mockMvc.perform(put("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.codigo").value("METODO_NO_PERMITIDO"))
                .andExpect(jsonPath("$.mensaje").value("Esta ruta no acepta PUT. Se acepta: POST"));
    }

    @Test
    void unTipoDeContenidoEquivocadoEs415YNo500() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("hola"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.codigo").value("TIPO_NO_SOPORTADO"));
    }

    @Test
    void unErrorInesperadoDevuelveSoloElCodigoDeSeguimiento() {
        HttpServletRequest pedido = mock(HttpServletRequest.class);
        when(pedido.getMethod()).thenReturn("GET");
        when(pedido.getRequestURI()).thenReturn("/api/proyectos");

        ResponseEntity<ErrorResponse> respuesta = new GlobalExceptionHandler().handleUnexpected(
                new IllegalStateException("detalle interno: tabla aporte, columna x"), pedido);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, respuesta.getStatusCode());
        ErrorResponse cuerpo = respuesta.getBody();
        assertThat(cuerpo.codigo()).isEqualTo("ERROR_INTERNO");
        assertThat(cuerpo.seguimiento()).hasSize(8);
        assertThat(cuerpo.mensaje()).endsWith(cuerpo.seguimiento());
        // Nada del error interno llega al cliente
        assertThat(cuerpo.mensaje()).doesNotContain("tabla", "columna", "IllegalState");
    }
}
