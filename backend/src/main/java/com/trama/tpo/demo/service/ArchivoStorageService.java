package com.trama.tpo.demo.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import com.trama.tpo.demo.exceptions.ApiException;

/**
 * Guarda los archivos adjuntos cifrados en disco, fuera de la base (0.3).
 * Los endpoints para subir y descargar son de la 4.3: ahí se verifican los permisos.
 */
@Service
public class ArchivoStorageService {

    private final Path directorio;
    private final CryptoService cryptoService;

    public ArchivoStorageService(
            @Value("${trama.archivos.directorio}") String directorio,
            CryptoService cryptoService) {

        if (directorio == null || directorio.isBlank()) {
            throw new IllegalStateException("UPLOADS_DIR no está configurada");
        }

        this.directorio = Path.of(directorio).toAbsolutePath().normalize();
        this.cryptoService = cryptoService;
    }

    // Cifra el contenido y lo guarda con un nombre UUID.
    // Devuelve ese UUID: es lo que va en la columna archivo.ruta.
    public UUID guardar(byte[] contenido) {

        UUID id = UUID.randomUUID();

        try {
            Files.createDirectories(directorio);
            Files.write(
                    directorio.resolve(id.toString()),
                    cryptoService.cifrar(contenido),
                    StandardOpenOption.CREATE_NEW);

        } catch (IOException e) {
            throw new IllegalStateException("No se pudo guardar el archivo", e);
        }

        return id;
    }

    // Lee el archivo guardado con ese UUID y lo devuelve descifrado.
    public byte[] leer(UUID id) {

        Path archivo = directorio.resolve(id.toString());

        if (!Files.exists(archivo)) {
            throw new ApiException(
                    "ARCHIVO_NO_ENCONTRADO",
                    "No encontramos este archivo",
                    HttpStatus.NOT_FOUND);
        }

        try {
            return cryptoService.descifrar(Files.readAllBytes(archivo));

        } catch (IOException e) {
            throw new IllegalStateException("No se pudo leer el archivo", e);
        }
    }
}
