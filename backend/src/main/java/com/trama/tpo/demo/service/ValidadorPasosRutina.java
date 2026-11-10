package com.trama.tpo.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.exceptions.ApiException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.UUID;

// 2.7: una rutina puede guardar sus pasos en orden dentro de "datos":
// {"pasos": [{"texto": "Lavarse los dientes", "archivoId": "..."}]}.
// La imagen de cada paso es opcional y tiene que venir también en archivoIds,
// así queda adjunta al aporte con los mismos permisos que el resto de sus archivos.
final class ValidadorPasosRutina {

    static final int MAXIMO_PASOS = 20;
    static final int LARGO_MAXIMO_TEXTO = 300;

    private ValidadorPasosRutina() {
    }

    static void validar(AporteRequest request, ObjectMapper mapper) {
        if (request.tipo() != TipoAporte.RUTINA || request.datos() == null || request.datos().isBlank()) {
            return;
        }
        JsonNode pasos;
        try {
            pasos = mapper.readTree(request.datos()).path("pasos");
        } catch (JsonProcessingException e) {
            throw invalido("Los datos de la rutina no son válidos");
        }
        if (pasos.isMissingNode()) {
            return;
        }
        if (!pasos.isArray() || pasos.size() > MAXIMO_PASOS) {
            throw invalido("La rutina puede tener hasta " + MAXIMO_PASOS + " pasos");
        }
        List<UUID> adjuntos = request.archivoIds() == null ? List.of() : request.archivoIds();
        for (JsonNode paso : pasos) {
            JsonNode texto = paso.path("texto");
            if (!paso.isObject() || !texto.isTextual() || texto.asText().isBlank()
                    || texto.asText().length() > LARGO_MAXIMO_TEXTO) {
                throw invalido("Cada paso necesita un texto de hasta " + LARGO_MAXIMO_TEXTO + " caracteres");
            }
            JsonNode archivoId = paso.path("archivoId");
            if (!archivoId.isMissingNode() && !archivoId.isNull()
                    && (!archivoId.isTextual() || !adjuntos.contains(comoUuid(archivoId.asText())))) {
                throw invalido("La imagen de un paso tiene que estar adjunta a la rutina");
            }
        }
    }

    private static UUID comoUuid(String texto) {
        try {
            return UUID.fromString(texto);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static ApiException invalido(String mensaje) {
        return new ApiException("DATOS_RUTINA_INVALIDOS", mensaje, HttpStatus.BAD_REQUEST);
    }
}
