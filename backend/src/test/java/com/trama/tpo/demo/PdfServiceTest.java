package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.trama.tpo.demo.service.PdfService;
import com.trama.tpo.demo.service.PdfService.Seccion;
import com.trama.tpo.demo.service.PdfService.Tabla;
import com.trama.tpo.demo.service.PdfService.Tarjeta;

// 8.1: PdfService es genérico; lo reutilizan la 8.3 y la 8.4
class PdfServiceTest {

    private final PdfService pdfService = new PdfService();

    @Test
    void generaUnPdf() {
        byte[] pdf = pdfService.generar("Datos de prueba",
                List.of(Seccion.deLineas("Perfil", List.of("Nombre: Niño Prueba"))));

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }

    @Test
    void aceptaTildesYEnie() {
        byte[] pdf = pdfService.generar("Información del niño",
                List.of(Seccion.deLineas("Acompañamiento", List.of("Le gusta la música y el fútbol"))));

        assertThat(pdf).isNotEmpty();
    }

    @Test
    void unaSeccionVaciaNoFalla() {
        byte[] pdf = pdfService.generar("Datos de prueba",
                List.of(Seccion.deLineas("Eventos", List.of()), new Seccion("Notas", null)));

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }

    @Test
    void unaTablaYUnaTarjetaNoFallan() {
        byte[] pdf = pdfService.generar("Datos de prueba", List.of(
                new Seccion("Miembros", List.of(new Tabla(
                        List.of("Nombre", "Rol"),
                        List.of(List.of("Tutora Prueba", "Tutor"), List.of("Docente Prueba", "Educación"))))),
                new Seccion("Aportes", List.of(new Tarjeta(
                        "FORTALEZA · 02/11/2026 · Tutora Prueba", "Le gusta dibujar", "Texto de prueba")))));

        assertThat(new String(pdf, 0, 5, StandardCharsets.US_ASCII)).isEqualTo("%PDF-");
    }

    // Las fuentes de TRAMA van embebidas: el PDF se ve igual en cualquier computadora
    @Test
    void embebeLasFuentesDeTrama() {
        byte[] pdf = pdfService.generar("Datos de prueba",
                List.of(Seccion.deLineas("Perfil", List.of("Texto de prueba"))));

        String contenido = new String(pdf, StandardCharsets.ISO_8859_1);
        assertThat(contenido).contains("Handlee").contains("NunitoSans");
    }
}
