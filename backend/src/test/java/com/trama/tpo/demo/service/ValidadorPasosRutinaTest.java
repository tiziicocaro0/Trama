package com.trama.tpo.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.exceptions.ApiException;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// 2.7: los pasos de una rutina se guardan en orden y cada uno puede llevar una imagen adjunta
class ValidadorPasosRutinaTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private AporteRequest rutina(String datos, List<UUID> archivoIds) {
        return new AporteRequest(TipoAporte.RUTINA, "Mañana de escuela", "Se prepara sola con la agenda",
                datos, Visibilidad.TODOS, archivoIds);
    }

    @Test
    void aceptaUnaRutinaSinPasosComoLasYaCargadas() {
        assertThatCode(() -> ValidadorPasosRutina.validar(rutina("{\"categoria\":\"ALIMENTACION\"}", null), mapper))
                .doesNotThrowAnyException();
    }

    @Test
    void aceptaPasosEnOrdenConLaImagenAdjunta() {
        UUID imagen = UUID.randomUUID();
        String datos = "{\"pasos\":[{\"texto\":\"Desayunar\"},{\"texto\":\"Lavarse los dientes\",\"archivoId\":\"" + imagen + "\"}]}";
        assertThatCode(() -> ValidadorPasosRutina.validar(rutina(datos, List.of(imagen)), mapper))
                .doesNotThrowAnyException();
    }

    @Test
    void rechazaUnPasoSinTexto() {
        assertThatThrownBy(() -> ValidadorPasosRutina.validar(rutina("{\"pasos\":[{\"texto\":\"  \"}]}", null), mapper))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Cada paso necesita un texto");
    }

    @Test
    void rechazaUnaImagenQueNoEstaAdjuntaALaRutina() {
        String datos = "{\"pasos\":[{\"texto\":\"Vestirse\",\"archivoId\":\"" + UUID.randomUUID() + "\"}]}";
        assertThatThrownBy(() -> ValidadorPasosRutina.validar(rutina(datos, List.of()), mapper))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("tiene que estar adjunta");
    }

    @Test
    void rechazaMasDeVeintePasos() {
        StringBuilder pasos = new StringBuilder();
        for (int i = 0; i <= ValidadorPasosRutina.MAXIMO_PASOS; i++) {
            pasos.append(i == 0 ? "" : ",").append("{\"texto\":\"Paso ").append(i).append("\"}");
        }
        assertThatThrownBy(() -> ValidadorPasosRutina.validar(rutina("{\"pasos\":[" + pasos + "]}", null), mapper))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("hasta 20 pasos");
    }

    @Test
    void noRevisaOtrosTiposDeAporte() {
        AporteRequest estrategia = new AporteRequest(TipoAporte.ESTRATEGIA, "Agenda", "Usar agenda",
                "{\"pasos\":\"no aplica\"}", Visibilidad.TODOS, null);
        assertThatCode(() -> ValidadorPasosRutina.validar(estrategia, mapper)).doesNotThrowAnyException();
    }
}
