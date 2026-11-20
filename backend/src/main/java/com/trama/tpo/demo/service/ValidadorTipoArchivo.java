package com.trama.tpo.demo.service;

import java.util.Locale;

import org.springframework.http.HttpStatus;

import com.trama.tpo.demo.exceptions.ApiException;

/**
 * Decide el tipo de un adjunto o recurso antes de guardarlo. Solo PDF, JPG o PNG, y las tres
 * fuentes tienen que coincidir: la extensión del nombre, el tipo que declara el navegador y la
 * firma real del contenido (FirmaArchivo).
 */
final class ValidadorTipoArchivo {

    private ValidadorTipoArchivo() {
    }

    /** Devuelve el tipo MIME a guardar, o lanza FORMATO_NO_PERMITIDO. */
    static String validar(String nombreOriginal, String tipoDeclarado, byte[] contenido) {
        String tipoMime = resolverYValidarTipoMime(nombreOriginal, tipoDeclarado);
        validarContenidoReal(contenido, tipoMime);
        return tipoMime;
    }

    // C8: la extensión y el tipo que declara el navegador se pueden falsificar renombrando el
    // archivo; la firma (los primeros bytes) dice qué es en realidad.
    private static void validarContenidoReal(byte[] contenido, String tipoDeclarado) {
        String tipoReal = FirmaArchivo.tipoDocumento(contenido);

        if (tipoReal == null) {
            throw new ApiException(
                    "FORMATO_NO_PERMITIDO",
                    "El contenido del archivo no es un PDF, JPG o PNG válido",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (!tipoReal.equals(tipoDeclarado)) {
            throw new ApiException(
                    "FORMATO_NO_PERMITIDO",
                    "El contenido del archivo no coincide con su extensión. Solo se permiten PDF, JPG o PNG",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private static String resolverYValidarTipoMime(String nombreOriginal, String contentType) {
        String extension = extraerExtension(nombreOriginal);
        String mimePorExtension = ArchivoService.EXTENSION_A_MIME.get(extension);

        String mimeNormalizado = contentType == null
                ? ""
                : contentType.trim().toLowerCase(Locale.ROOT);
        if ("image/jpg".equals(mimeNormalizado)) {
            mimeNormalizado = "image/jpeg";
        }

        // Si tiene extensión pero no es pdf, jpg, jpeg ni png (ej. .exe), rechazar siempre
        if (!extension.isEmpty() && mimePorExtension == null) {
            throw new ApiException(
                    "FORMATO_NO_PERMITIDO",
                    "Formato no permitido. Solo podés adjuntar archivos PDF, JPG o PNG",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (ArchivoService.MIMES_PERMITIDOS.contains(mimeNormalizado)) {
            if (mimePorExtension != null && !mimePorExtension.equals(mimeNormalizado)) {
                throw new ApiException(
                        "FORMATO_NO_PERMITIDO",
                        "El formato del archivo no coincide con su extensión. Solo se permiten PDF, JPG o PNG",
                        HttpStatus.BAD_REQUEST
                );
            }
            return mimeNormalizado;
        }

        if (mimePorExtension != null && (mimeNormalizado.isEmpty() || "application/octet-stream".equals(mimeNormalizado))) {
            return mimePorExtension;
        }

        throw new ApiException(
                "FORMATO_NO_PERMITIDO",
                "Formato no permitido. Solo podés adjuntar archivos PDF, JPG o PNG",
                HttpStatus.BAD_REQUEST
        );
    }

    private static String extraerExtension(String nombreArchivo) {
        int ultimoPunto = nombreArchivo.lastIndexOf('.');
        if (ultimoPunto < 0 || ultimoPunto == nombreArchivo.length() - 1) {
            return "";
        }
        return nombreArchivo.substring(ultimoPunto + 1).toLowerCase(Locale.ROOT);
    }
}
