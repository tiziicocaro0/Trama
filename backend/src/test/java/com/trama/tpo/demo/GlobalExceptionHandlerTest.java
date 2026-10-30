package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.trama.tpo.demo.exceptions.GlobalExceptionHandler;
import com.trama.tpo.demo.exceptions.GlobalExceptionHandler.ErrorResponse;
import com.trama.tpo.demo.service.ArchivoService;

// 4.3: si Spring corta la subida por tamaño, la respuesta es un 400 claro (no un 500).
class GlobalExceptionHandlerTest {

    @Test
    void unArchivoMasGrandeQueElLimiteDeSpringDevuelve400ConElLimite() {
        ResponseEntity<ErrorResponse> respuesta = new GlobalExceptionHandler()
                .handleMaxUploadSize(new MaxUploadSizeExceededException(
                        ArchivoService.TAMANO_MAXIMO_BYTES + 1));

        assertEquals(HttpStatus.BAD_REQUEST, respuesta.getStatusCode());
        assertEquals("ARCHIVO_DEMASIADO_GRANDE", respuesta.getBody().codigo());
        assertEquals("El archivo supera el tamaño máximo permitido de "
                        + ArchivoService.TAMANO_MAXIMO_MB + " MB",
                respuesta.getBody().mensaje());
    }
}
