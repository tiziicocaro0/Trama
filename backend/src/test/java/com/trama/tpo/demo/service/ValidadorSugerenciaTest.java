package com.trama.tpo.demo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.exceptions.ApiException;
import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// 7.2: cada sugerencia para casa queda vinculada a un interés del mismo niño
class ValidadorSugerenciaTest {

    private final ObjectMapper mapper = new ObjectMapper();
    private final UUID interes = UUID.randomUUID();
    private final UUID fortaleza = UUID.randomUUID();
    private final Function<UUID, TipoAporte> tipos =
            Map.of(interes, TipoAporte.INTERES, fortaleza, TipoAporte.FORTALEZA)::get;

    private AporteRequest sugerencia(String contenido, String datos) {
        return new AporteRequest(TipoAporte.SUGERENCIA, "Contar dinosaurios en la merienda", contenido,
                datos, Visibilidad.TODOS);
    }

    @Test
    void aceptaUnaSugerenciaVinculadaAUnInteresConMateriales() {
        String datos = "{\"interesId\":\"" + interes + "\",\"materiales\":\"Muñecos de dinosaurios\"}";
        assertThatCode(() -> ValidadorSugerencia.validar(sugerencia("Ordenarlos por tamaño", datos), mapper, tipos))
                .doesNotThrowAnyException();
    }

    @Test
    void pideElInteresVinculado() {
        assertThatThrownBy(() -> ValidadorSugerencia.validar(sugerencia("Ordenarlos", "{}"), mapper, tipos))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Elegí el interés");
    }

    @Test
    void rechazaUnVinculoQueNoEsUnInteresDelPerfil() {
        String aFortaleza = "{\"interesId\":\"" + fortaleza + "\"}";
        String aOtroNino = "{\"interesId\":\"" + UUID.randomUUID() + "\"}";
        assertThatThrownBy(() -> ValidadorSugerencia.validar(sugerencia("Ordenarlos", aFortaleza), mapper, tipos))
                .hasMessageContaining("no es de este perfil");
        assertThatThrownBy(() -> ValidadorSugerencia.validar(sugerencia("Ordenarlos", aOtroNino), mapper, tipos))
                .hasMessageContaining("no es de este perfil");
    }

    @Test
    void pideContarComoHacerLaActividad() {
        String datos = "{\"interesId\":\"" + interes + "\"}";
        assertThatThrownBy(() -> ValidadorSugerencia.validar(sugerencia(" ", datos), mapper, tipos))
                .hasMessageContaining("Contá cómo hacer");
    }
}
