package com.trama.tpo.demo.common;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Component
@Converter
public class CifradoConverter implements AttributeConverter<String, byte[]> {
    private static final int NONCE_BYTES = 12;
    private final SecureRandom random = new SecureRandom();
    private final String claveConfigurada;

    public CifradoConverter(@Value("${TRAMA_CRYPTO_KEY:}") String claveConfigurada) {
        this.claveConfigurada = claveConfigurada;
    }

    private SecretKeySpec clave() {
        try {
            byte[] bytes = Base64.getDecoder().decode(claveConfigurada);
            if (bytes.length != 32) throw new IllegalArgumentException();
            return new SecretKeySpec(bytes, "AES");
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Configurá TRAMA_CRYPTO_KEY con 32 bytes codificados en Base64", e);
        }
    }

    @Override
    public byte[] convertToDatabaseColumn(String texto) {
        if (texto == null) return null;
        try {
            byte[] nonce = new byte[NONCE_BYTES];
            random.nextBytes(nonce);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, clave(), new GCMParameterSpec(128, nonce));
            byte[] cifrado = cipher.doFinal(texto.getBytes(StandardCharsets.UTF_8));
            return ByteBuffer.allocate(1 + nonce.length + cifrado.length).put((byte) 1).put(nonce).put(cifrado).array();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo proteger el contenido", e);
        }
    }

    @Override
    public String convertToEntityAttribute(byte[] bytes) {
        if (bytes == null) return null;
        if (bytes.length < 1 + NONCE_BYTES + 16 || bytes[0] != 1) {
            throw new IllegalStateException("Formato de contenido protegido inválido");
        }
        try {
            ByteBuffer buffer = ByteBuffer.wrap(bytes);
            buffer.get();
            byte[] nonce = new byte[NONCE_BYTES];
            buffer.get(nonce);
            byte[] cifrado = new byte[buffer.remaining()];
            buffer.get(cifrado);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, clave(), new GCMParameterSpec(128, nonce));
            return new String(cipher.doFinal(cifrado), StandardCharsets.UTF_8);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo leer el contenido protegido", e);
        }
    }
}
