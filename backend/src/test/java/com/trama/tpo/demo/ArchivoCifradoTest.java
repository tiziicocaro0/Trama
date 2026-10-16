package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.trama.tpo.demo.service.CryptoService;

class ArchivoCifradoTest {

    // Un PDF de mentira: empieza con la firma "%PDF" como uno real
    private static final byte[] PDF =
            "%PDF-1.4\nInforme ficticio de la escuela".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path carpeta;

    private CryptoService cryptoService;

    @BeforeEach
    void crearServicio() {

        byte[] clave = new byte[32];
        new SecureRandom().nextBytes(clave);

        cryptoService = new CryptoService(Base64.getEncoder().encodeToString(clave));
    }

    @Test
    void elArchivoEnDiscoNoEsElOriginal() throws IOException {

        Path archivo = carpeta.resolve("adjunto");
        Files.write(archivo, cryptoService.cifrar(PDF));

        byte[] enDisco = Files.readAllBytes(archivo);

        assertThat(enDisco).isNotEqualTo(PDF);
        assertThat(new String(enDisco, StandardCharsets.UTF_8))
                .doesNotStartWith("%PDF")
                .doesNotContain("Informe ficticio");
    }

    @Test
    void descifrandoSeRecuperaElArchivo() throws IOException {

        Path archivo = carpeta.resolve("adjunto");
        Files.write(archivo, cryptoService.cifrar(PDF));

        byte[] recuperado = cryptoService.descifrar(Files.readAllBytes(archivo));

        assertThat(recuperado).isEqualTo(PDF);
    }
}
