package com.trama.tpo.demo.service;

/**
 * Reconoce el tipo real de un archivo por su firma: los primeros bytes que cada formato escribe
 * siempre al principio. No confía en la extensión ni en el tipo que declara el navegador, que
 * cualquiera puede cambiar renombrando el archivo (hallazgo C8 del informe de carga).
 *
 * Lo usan los adjuntos y recursos (ArchivoService), la foto (FotoService) y el comprobante de
 * matrícula (CuentaService).
 */
public final class FirmaArchivo {

    public static final String PDF = "application/pdf";
    public static final String JPEG = "image/jpeg";
    public static final String PNG = "image/png";

    private static final byte[] FIRMA_PDF = {'%', 'P', 'D', 'F', '-'};
    private static final byte[] FIRMA_JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] FIRMA_PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A};

    private FirmaArchivo() {
    }

    /** PDF, JPG o PNG según su contenido; null si no es ninguno de los tres. */
    public static String tipoDocumento(byte[] contenido) {
        if (empiezaCon(contenido, FIRMA_PDF)) {
            return PDF;
        }
        return tipoImagen(contenido);
    }

    /** JPG o PNG según su contenido; null si no es ninguno de los dos. */
    public static String tipoImagen(byte[] contenido) {
        if (empiezaCon(contenido, FIRMA_JPEG)) {
            return JPEG;
        }
        if (empiezaCon(contenido, FIRMA_PNG)) {
            return PNG;
        }
        return null;
    }

    private static boolean empiezaCon(byte[] contenido, byte[] firma) {
        if (contenido == null || contenido.length < firma.length) {
            return false;
        }
        for (int i = 0; i < firma.length; i++) {
            if (contenido[i] != firma[i]) {
                return false;
            }
        }
        return true;
    }
}
