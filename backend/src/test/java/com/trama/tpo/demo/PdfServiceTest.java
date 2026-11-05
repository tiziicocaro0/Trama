package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.trama.tpo.demo.service.PdfService;
import com.trama.tpo.demo.service.PdfService.Seccion;

// 8.1: PdfService es genérico; lo reutilizan la 8.3 y la 8.4
class PdfServiceTest {

    private final PdfService pdfService = new PdfService();

    @Test
    void generaUnPdf() {
        byte[] pdf = pdfService.generar("Datos de prueba",
                List.of(new Seccion("Perfil", List.of("Nombre: Niño Prueba"))));

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }

    @Test
    void aceptaTildesYEnie() {
        byte[] pdf = pdfService.generar("Información del niño",
                List.of(new Seccion("Acompañamiento", List.of("Le gusta la música y el fútbol"))));

        assertThat(pdf).isNotEmpty();
    }

    @Test
    void unaSeccionVaciaNoFalla() {
        byte[] pdf = pdfService.generar("Datos de prueba",
                List.of(new Seccion("Eventos", List.of()), new Seccion("Notas", null)));

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }
}
