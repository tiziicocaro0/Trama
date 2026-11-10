package com.trama.tpo.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.exceptions.ApiException;
import org.springframework.http.HttpStatus;

import java.util.UUID;
import java.util.function.Function;

// 7.2: una sugerencia para casa va vinculada a un interés del niño:
// {"interesId": "...", "materiales": "..."}. Los materiales son opcionales.
// tipoDeAporte devuelve el tipo de un aporte de este proyecto (o null si no existe),
// así se comprueba que el vínculo apunte a un interés del mismo niño.
final class ValidadorSugerencia {

    static final int LARGO_MAXIMO_MATERIALES = 500;

    private ValidadorSugerencia() {
    }

    static void validar(AporteRequest request, ObjectMapper mapper, Function<UUID, TipoAporte> tipoDeAporte) {
        if (request.tipo() != TipoAporte.SUGERENCIA) {
            return;
        }
        if (request.contenido() == null || request.contenido().isBlank()) {
            throw invalido("Contá cómo hacer la actividad");
        }
        JsonNode datos;
        try {
            datos = request.datos() == null ? null : mapper.readTree(request.datos());
        } catch (JsonProcessingException e) {
            throw invalido("Los datos de la sugerencia no son válidos");
        }
        if (datos == null || !datos.isObject()) {
            throw invalido("Elegí el interés con el que se relaciona");
        }
        UUID interesId;
        try {
            interesId = UUID.fromString(datos.path("interesId").asText());
        } catch (IllegalArgumentException e) {
            throw invalido("Elegí el interés con el que se relaciona");
        }
        if (tipoDeAporte.apply(interesId) != TipoAporte.INTERES) {
            throw invalido("El interés elegido no es de este perfil");
        }
        JsonNode materiales = datos.path("materiales");
        if (!materiales.isMissingNode()
                && (!materiales.isTextual() || materiales.asText().length() > LARGO_MAXIMO_MATERIALES)) {
            throw invalido("Los materiales pueden tener hasta " + LARGO_MAXIMO_MATERIALES + " caracteres");
        }
    }

    private static ApiException invalido(String mensaje) {
        return new ApiException("DATOS_SUGERENCIA_INVALIDOS", mensaje, HttpStatus.BAD_REQUEST);
    }
}
