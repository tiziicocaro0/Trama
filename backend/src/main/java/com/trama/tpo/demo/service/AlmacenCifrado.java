package com.trama.tpo.demo.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.trama.tpo.demo.exceptions.ApiException;

/**
 * Guarda y lee archivos cifrados en disco (0.3). El nombre en disco es un UUID:
 * no revela nada del contenido. Lo usan los adjuntos y las fotos.
 */
@Component
public class AlmacenCifrado {

    private static final Logger log = LoggerFactory.getLogger(AlmacenCifrado.class);

    private final CryptoService cryptoService;
    private final Path directorio;

    public AlmacenCifrado(
            CryptoService cryptoService,
            @Value("${trama.archivos.directorio:./uploads}") String rutaDirectorio) {
        this.cryptoService = cryptoService;
        this.directorio = Paths.get(rutaDirectorio).toAbsolutePath().normalize();
    }

    /** Cifra y guarda el contenido. Devuelve el nombre en disco. */
    public String guardar(byte[] contenido) {
        String ruta = UUID.randomUUID().toString();
        try {
            Files.createDirectories(directorio);
            Files.write(directorio.resolve(ruta).normalize(), cryptoService.cifrar(contenido));
            return ruta;
        } catch (IOException e) {
            throw new ApiException("ERROR_ALMACENAMIENTO",
                    "No se pudo almacenar el archivo", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public boolean existe(String ruta) {
        return Files.exists(directorio.resolve(ruta).normalize());
    }

    /** Lee y descifra un archivo guardado. */
    public byte[] leer(String ruta) {
        try {
            return cryptoService.descifrar(Files.readAllBytes(directorio.resolve(ruta).normalize()));
        } catch (IOException | IllegalStateException e) {
            throw new ApiException("ERROR_LECTURA_ARCHIVO",
                    "No se pudo leer el archivo", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Borra el archivo del disco recién cuando se confirma la transacción:
     * si la base hace rollback, el archivo sigue ahí.
     */
    public void borrarAlConfirmar(String ruta) {
        Runnable borrar = () -> {
            try {
                Files.deleteIfExists(directorio.resolve(ruta).normalize());
            } catch (IOException e) {
                log.warn("No se pudo borrar un archivo del disco: {}", ruta);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    borrar.run();
                }
            });
        } else {
            borrar.run();
        }
    }
}
