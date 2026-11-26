package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;

import com.trama.tpo.demo.service.FirmaArchivo;

/** C8: el tipo de un archivo se decide por su contenido, no por su nombre. */
class FirmaArchivoTest {

    private static final byte[] PDF = "%PDF-1.7 informe".getBytes(StandardCharsets.US_ASCII);
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00};
    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00};
    private static final byte[] EXE = {'M', 'Z', (byte) 0x90, 0x00};

    @Test
    void reconoceLosTresFormatosPermitidos() {
        assertThat(FirmaArchivo.tipoDocumento(PDF)).isEqualTo(FirmaArchivo.PDF);
        assertThat(FirmaArchivo.tipoDocumento(PNG)).isEqualTo(FirmaArchivo.PNG);
        assertThat(FirmaArchivo.tipoDocumento(JPG)).isEqualTo(FirmaArchivo.JPEG);
    }

    @Test
    void unaFotoSoloPuedeSerImagen() {
        assertThat(FirmaArchivo.tipoImagen(PNG)).isEqualTo(FirmaArchivo.PNG);
        assertThat(FirmaArchivo.tipoImagen(PDF)).isNull();
    }

    @Test
    void rechazaEjecutablesTextoYArchivosVaciosOCortos() {
        assertThat(FirmaArchivo.tipoDocumento(EXE)).isNull();
        assertThat(FirmaArchivo.tipoDocumento("hola".getBytes(StandardCharsets.UTF_8))).isNull();
        assertThat(FirmaArchivo.tipoDocumento(new byte[0])).isNull();
        assertThat(FirmaArchivo.tipoDocumento(null)).isNull();
        // Solo el principio de la firma de PNG no alcanza
        assertThat(FirmaArchivo.tipoDocumento(new byte[] {(byte) 0x89, 'P', 'N', 'G'})).isNull();
    }
}
