package com.trama.tpo.demo.config;

import org.springframework.stereotype.Component;

import com.trama.tpo.demo.service.CryptoService;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Cifra el texto libre sobre el niño al guardarlo y lo descifra al leerlo (historia 0.20).
 * Uso en una entidad: @Convert(converter = CifradoConverter.class)
 * La columna tiene que ser binaria (VARBINARY o MEDIUMBLOB).
 */
@Component
@Converter
public class CifradoConverter implements AttributeConverter<String, byte[]> {

    private final CryptoService cryptoService;

    public CifradoConverter(CryptoService cryptoService) {
        this.cryptoService = cryptoService;
    }

    // Al guardar: texto -> bytes cifrados
    @Override
    public byte[] convertToDatabaseColumn(String texto) {

        if (texto == null) {
            return null;
        }

        return cryptoService.cifrarTexto(texto);
    }

    // Al leer: bytes cifrados -> texto
    @Override
    public String convertToEntityAttribute(byte[] valor) {

        if (valor == null) {
            return null;
        }

        return cryptoService.descifrarTexto(valor);
    }
}
