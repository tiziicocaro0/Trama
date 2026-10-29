package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.trama.tpo.demo.service.CryptoService;

class CryptoServiceTest {

    private static final String TEXTO = "Le cuesta el ruido fuerte en el recreo";

    private CryptoService cryptoService;

    @BeforeEach
    void crearServicio() {
        cryptoService = new CryptoService(claveAleatoria());
    }

    @Test
    void cifraYDescifraElTextoOriginal() {

        byte[] cifrado = cryptoService.cifrarTexto(TEXTO);

        assertThat(cryptoService.descifrarTexto(cifrado)).isEqualTo(TEXTO);
    }

    @Test
    void elCifradoNoContieneElTextoOriginal() {

        byte[] cifrado = cryptoService.cifrarTexto(TEXTO);

        assertThat(new String(cifrado, StandardCharsets.UTF_8)).doesNotContain(TEXTO);
    }

    @Test
    void elMismoTextoDaCifradosDistintos() {

        // Cada valor usa un IV aleatorio
        byte[] primero = cryptoService.cifrarTexto(TEXTO);
        byte[] segundo = cryptoService.cifrarTexto(TEXTO);

        assertThat(primero).isNotEqualTo(segundo);
    }

    @Test
    void otraClaveNoPuedeDescifrar() {

        byte[] cifrado = cryptoService.cifrarTexto(TEXTO);
        CryptoService otraClave = new CryptoService(claveAleatoria());

        assertThrows(IllegalStateException.class,
                () -> otraClave.descifrarTexto(cifrado));
    }

    @Test
    void unDatoAlteradoNoSeDescifra() {

        byte[] cifrado = cryptoService.cifrarTexto(TEXTO);
        cifrado[cifrado.length - 1] ^= 1;   // cambia un bit

        assertThrows(IllegalStateException.class,
                () -> cryptoService.descifrarTexto(cifrado));
    }

    @Test
    void cifraYDescifraBytes() {

        byte[] archivo = {1, 2, 3, 4, 5, 0, -1};

        assertThat(cryptoService.descifrar(cryptoService.cifrar(archivo)))
                .isEqualTo(archivo);
    }

    @Test
    void rechazaUnaClaveDeLargoIncorrecto() {

        String claveCorta = Base64.getEncoder().encodeToString(new byte[16]);

        assertThrows(IllegalStateException.class,
                () -> new CryptoService(claveCorta));
    }

    @Test
    void rechazaUnaClaveQueNoEsBase64() {

        assertThrows(IllegalStateException.class,
                () -> new CryptoService("esto no es base64!!"));
    }

    private static String claveAleatoria() {

        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);

        return Base64.getEncoder().encodeToString(bytes);
    }
}
