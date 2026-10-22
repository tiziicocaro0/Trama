package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.service.ArchivoStorageService;
import com.trama.tpo.demo.service.CryptoService;

class ArchivoStorageServiceTest {

    // Un PDF de mentira: empieza con la firma "%PDF" como uno real
    private static final byte[] PDF =
            "%PDF-1.4\nInforme ficticio de la escuela".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path carpeta;

    private CryptoService cryptoService;
    private ArchivoStorageService storage;

    @BeforeEach
    void crearServicio() {

        byte[] clave = new byte[32];
        new SecureRandom().nextBytes(clave);

        cryptoService = new CryptoService(Base64.getEncoder().encodeToString(clave));
        storage = new ArchivoStorageService(carpeta.toString(), cryptoService);
    }

    // Entregable: guardar y leer devuelve el mismo contenido
    @Test
    void guardarYLeerDevuelveElMismoContenido() {

        UUID id = storage.guardar(PDF);

        assertThat(storage.leer(id)).isEqualTo(PDF);
    }

    // Se guarda con nombre UUID y cifrado: no se puede abrir sin descifrar
    @Test
    void elArchivoEnDiscoTieneNombreUuidYEstaCifrado() throws IOException {

        UUID id = storage.guardar(PDF);

        Path enDisco = carpeta.resolve(id.toString());
        assertThat(enDisco).exists();

        byte[] bytes = Files.readAllBytes(enDisco);
        assertThat(bytes).isNotEqualTo(PDF);
        assertThat(new String(bytes, StandardCharsets.UTF_8))
                .doesNotStartWith("%PDF")
                .doesNotContain("Informe ficticio");
    }

    // Dos archivos iguales no se pisan ni se delatan entre sí
    @Test
    void dosArchivosIgualesTienenNombreYContenidoDistintos() throws IOException {

        UUID primero = storage.guardar(PDF);
        UUID segundo = storage.guardar(PDF);

        assertThat(primero).isNotEqualTo(segundo);
        assertThat(Files.readAllBytes(carpeta.resolve(primero.toString())))
                .isNotEqualTo(Files.readAllBytes(carpeta.resolve(segundo.toString())));
    }

    @Test
    void leerUnArchivoQueNoExisteDa404() {

        ApiException error = assertThrows(ApiException.class,
                () -> storage.leer(UUID.randomUUID()));

        assertThat(error.getCodigo()).isEqualTo("ARCHIVO_NO_ENCONTRADO");
    }

    @Test
    void creaLaCarpetaSiNoExiste() {

        Path subcarpeta = carpeta.resolve("todavia-no-existe");
        ArchivoStorageService otro = new ArchivoStorageService(subcarpeta.toString(), cryptoService);

        UUID id = otro.guardar(PDF);

        assertThat(subcarpeta.resolve(id.toString())).exists();
    }

    @Test
    void noArrancaSinCarpetaConfigurada() {

        assertThrows(IllegalStateException.class,
                () -> new ArchivoStorageService("  ", cryptoService));
    }
}
