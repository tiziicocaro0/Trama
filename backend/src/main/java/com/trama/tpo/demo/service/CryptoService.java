package com.trama.tpo.demo.service;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class CryptoService {

    private static final String ALGORITMO = "AES/GCM/NoPadding";
    private static final int CLAVE_BYTES = 32;   // AES-256
    private static final int IV_BYTES = 12;      // tamaño recomendado para GCM
    private static final int TAG_BITS = 128;     // tag de autenticación de GCM

    private final SecretKey clave;
    private final SecureRandom random = new SecureRandom();

    public CryptoService(@Value("${TRAMA_CRYPTO_KEY}") String claveBase64) {

        byte[] bytes;

        try {
            bytes = Base64.getDecoder().decode(claveBase64);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                    "TRAMA_CRYPTO_KEY no es un valor base64 válido", e);
        }

        if (bytes.length != CLAVE_BYTES) {
            throw new IllegalStateException(
                    "TRAMA_CRYPTO_KEY tiene que tener 32 bytes (AES-256)");
        }

        this.clave = new SecretKeySpec(bytes, "AES");
    }

    // Devuelve [IV de 12 bytes][texto cifrado + tag]
    public byte[] cifrar(byte[] datos) {

        byte[] iv = new byte[IV_BYTES];
        random.nextBytes(iv);

        try {
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.ENCRYPT_MODE, clave, new GCMParameterSpec(TAG_BITS, iv));

            byte[] cifrado = cipher.doFinal(datos);

            return ByteBuffer.allocate(IV_BYTES + cifrado.length)
                    .put(iv)
                    .put(cifrado)
                    .array();

        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo cifrar el dato", e);
        }
    }

    // Recibe [IV][texto cifrado + tag] y devuelve los datos originales
    public byte[] descifrar(byte[] valor) {

        if (valor == null || valor.length <= IV_BYTES) {
            throw new IllegalStateException("El dato cifrado está incompleto");
        }

        try {
            Cipher cipher = Cipher.getInstance(ALGORITMO);
            cipher.init(Cipher.DECRYPT_MODE, clave,
                    new GCMParameterSpec(TAG_BITS, valor, 0, IV_BYTES));

            return cipher.doFinal(valor, IV_BYTES, valor.length - IV_BYTES);

        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo descifrar el dato", e);
        }
    }

    public byte[] cifrarTexto(String texto) {
        return cifrar(texto.getBytes(StandardCharsets.UTF_8));
    }

    public String descifrarTexto(byte[] valor) {
        return new String(descifrar(valor), StandardCharsets.UTF_8);
    }
}
