package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.trama.tpo.demo.config.CifradoConverter;
import com.trama.tpo.demo.service.CryptoService;

class CifradoConverterTest {

    private static final String TEXTO = "Se calma con su música preferida y auriculares";

    private CifradoConverter converter;

    @BeforeEach
    void crearConverter() {

        byte[] clave = new byte[32];
        new SecureRandom().nextBytes(clave);

        converter = new CifradoConverter(
                new CryptoService(Base64.getEncoder().encodeToString(clave)));
    }

    @Test
    void loQueSeGuardaNoEsElTextoOriginal() {

        byte[] columna = converter.convertToDatabaseColumn(TEXTO);

        assertThat(new String(columna, StandardCharsets.UTF_8)).doesNotContain(TEXTO);
    }

    @Test
    void alLeerDevuelveElTextoOriginal() {

        byte[] columna = converter.convertToDatabaseColumn(TEXTO);

        assertThat(converter.convertToEntityAttribute(columna)).isEqualTo(TEXTO);
    }

    @Test
    void nullSigueSiendoNull() {

        assertThat(converter.convertToDatabaseColumn(null)).isNull();
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }
}
