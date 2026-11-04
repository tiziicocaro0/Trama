package com.trama.tpo.demo.service;

import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.trama.tpo.demo.exceptions.ApiException;

/**
 * Arma PDFs de texto con OpenPDF (8.1; lo reutilizan la 8.3 y la 8.4).
 * No sabe nada del dominio: cada card arma sus secciones.
 */
@Service
public class PdfService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final float MARGEN = 56.7f; // 2 cm

    private static final Font TITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
    private static final Font SUBTITULO = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
    private static final Font TEXTO = FontFactory.getFont(FontFactory.HELVETICA, 10);
    private static final Font PIE = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8);

    /** Un bloque del documento: un subtítulo y sus renglones. */
    public record Seccion(String titulo, List<String> lineas) {}

    public byte[] generar(String titulo, List<Seccion> secciones) {

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4, MARGEN, MARGEN, MARGEN, MARGEN);

        try {
            PdfWriter.getInstance(documento, salida);
            documento.open();

            Paragraph encabezado = new Paragraph(titulo, TITULO);
            encabezado.setSpacingAfter(12);
            documento.add(encabezado);

            for (Seccion seccion : secciones) {
                Paragraph subtitulo = new Paragraph(seccion.titulo(), SUBTITULO);
                subtitulo.setSpacingBefore(10);
                subtitulo.setSpacingAfter(4);
                documento.add(subtitulo);

                if (seccion.lineas() == null || seccion.lineas().isEmpty()) {
                    documento.add(new Paragraph("Sin datos", TEXTO));
                    continue;
                }
                for (String linea : seccion.lineas()) {
                    documento.add(new Paragraph(linea == null ? "" : linea, TEXTO));
                }
            }

            Paragraph pie = new Paragraph(
                    "Generado por TRAMA el " + FECHA.format(ZonedDateTime.now(ZONA)), PIE);
            pie.setSpacingBefore(16);
            pie.setAlignment(Element.ALIGN_RIGHT);
            documento.add(pie);

            documento.close();
            return salida.toByteArray();

        } catch (RuntimeException e) {
            // Sin el contenido en el mensaje: puede tener datos del niño
            throw new ApiException(
                    "PDF_NO_GENERADO",
                    "No se pudo generar el PDF",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
