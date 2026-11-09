package com.trama.tpo.demo.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.service.pdf.EstiloPdf;
import com.trama.tpo.demo.service.pdf.LineaDeTiempoPdf;
import com.trama.tpo.demo.service.pdf.MarcoPaginaPdf;

/**
 * Arma PDFs con la identidad de TRAMA usando OpenPDF (8.1; lo reutilizan la 8.3 y la 8.4).
 * No sabe nada del dominio: cada card arma sus secciones con bloques de texto, tablas o tarjetas.
 */
@Service
public class PdfService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy · HH:mm");
    private static final float MARGEN = 56.7f;        // 2 cm
    private static final float MARGEN_SUPERIOR = 90;  // deja lugar al encabezado con el logo

    /** Un bloque del documento: un subtítulo y su contenido. */
    public record Seccion(String titulo, List<Bloque> bloques) {

        // Atajo: una sección de renglones de texto
        public static Seccion deLineas(String titulo, List<String> lineas) {
            return new Seccion(titulo, lineas == null
                    ? List.of()
                    : lineas.stream().<Bloque>map(Texto::new).toList());
        }
    }

    public sealed interface Bloque permits Texto, Tabla, Tarjeta, LineaDeTiempo, Leyenda {}

    public record Texto(String contenido) implements Bloque {}

    public record Tabla(List<String> columnas, List<List<String>> filas) implements Bloque {}

    /** Por ejemplo: etiqueta "FORTALEZA · 02/11/2026 · María P.", título y texto. */
    /** tono opcional: con tono, la tarjeta toma el color de quien aportó (8.3); sin tono, la crema de siempre. */
    public record Tarjeta(String etiqueta, String titulo, String cuerpo, Tono tono) implements Bloque {
        public Tarjeta(String etiqueta, String titulo, String cuerpo) {
            this(etiqueta, titulo, cuerpo, null);
        }
    }

    /** La referencia de colores (familia, docentes, profesionales). */
    public record Leyenda() implements Bloque {}

    /** Quién aportó: define el color de la caja en la línea de tiempo. */
    public enum Tono { FAMILIA, DOCENTE, PROFESIONAL, NEUTRO }

    /** Un punto de la línea de tiempo: fecha, color, etiqueta, título y texto. */
    public record Hito(LocalDate fecha, Tono tono, String etiqueta, String titulo, String cuerpo) {}

    /** Aportes en orden, agrupados por mes, como la historia laboral de un CV. */
    public record LineaDeTiempo(List<Hito> hitos) implements Bloque {}

    private final EstiloPdf estilo = new EstiloPdf();
    private final LineaDeTiempoPdf lineaDeTiempo = new LineaDeTiempoPdf(estilo);
    private final byte[] logo = leerLogo();

    public byte[] generar(String titulo, List<Seccion> secciones) {

        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4, MARGEN, MARGEN, MARGEN_SUPERIOR, MARGEN);

        try {
            PdfWriter writer = PdfWriter.getInstance(documento, salida);
            writer.setPageEvent(new MarcoPaginaPdf(
                    estilo, Image.getInstance(logo), FECHA.format(ZonedDateTime.now(ZONA))));
            documento.open();

            documento.add(banda(titulo));

            for (Seccion seccion : secciones) {
                List<Element> elementos = elementosDe(seccion);

                // Una sección sin título (por ejemplo, la leyenda de colores) va directo
                if (seccion.titulo() == null) {
                    for (Element elemento : elementos) {
                        documento.add(elemento);
                    }
                    continue;
                }

                // El subtítulo va pegado a su primer bloque: nunca queda solo al pie de una página
                PdfPTable encabezado = new PdfPTable(1);
                encabezado.setWidthPercentage(100);
                encabezado.setKeepTogether(true);
                PdfPCell subtitulo = new PdfPCell(new Paragraph(seccion.titulo(), estilo.subtitulo));
                subtitulo.setBorder(Rectangle.NO_BORDER);
                subtitulo.setPadding(0);
                subtitulo.setPaddingTop(14);
                subtitulo.setPaddingBottom(6);
                encabezado.addCell(subtitulo);
                PdfPCell primero = new PdfPCell();
                primero.addElement(elementos.get(0));
                primero.setBorder(Rectangle.NO_BORDER);
                primero.setPadding(0);
                encabezado.addCell(primero);
                documento.add(encabezado);

                for (Element elemento : elementos.subList(1, elementos.size())) {
                    documento.add(elemento);
                }
            }

            documento.close();
            return salida.toByteArray();

        } catch (RuntimeException | IOException e) {
            // Sin el contenido en el mensaje: puede tener datos del niño
            throw new ApiException(
                    "PDF_NO_GENERADO",
                    "No se pudo generar el PDF",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Los elementos de una sección; si no tiene bloques, "Sin datos"
    private List<Element> elementosDe(Seccion seccion) {
        if (seccion.bloques() == null || seccion.bloques().isEmpty()) {
            return List.of(new Paragraph("Sin datos", estilo.texto));
        }
        List<Element> elementos = new ArrayList<>();
        for (Bloque bloque : seccion.bloques()) {
            switch (bloque) {
                case Texto t -> elementos.add(parrafo(t.contenido()));
                case Tabla t -> elementos.add(tabla(t));
                case Tarjeta t -> elementos.add(tarjeta(t));
                case LineaDeTiempo l -> elementos.addAll(lineaDeTiempo.armar(l));
                case Leyenda l -> elementos.add(lineaDeTiempo.leyenda());
            }
        }
        return elementos;
    }

    // Título en Handlee terracota sobre una banda crema
    private PdfPTable banda(String titulo) {
        PdfPCell celda = new PdfPCell(new Phrase(titulo, estilo.titulo));
        celda.setBackgroundColor(EstiloPdf.CREMA);
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setPadding(12);
        celda.setPaddingBottom(16);
        return unaColumna(celda, 4);
    }

    private Paragraph parrafo(String texto) {
        Paragraph parrafo = new Paragraph(texto == null ? "" : texto, estilo.texto);
        parrafo.setSpacingAfter(3);
        return parrafo;
    }

    // Encabezado oliva con letra blanca y filas con borde suave
    private PdfPTable tabla(Tabla tabla) {
        PdfPTable resultado = new PdfPTable(tabla.columnas().size());
        resultado.setWidthPercentage(100);
        resultado.setSpacingAfter(6);
        resultado.setHeaderRows(1);

        for (String columna : tabla.columnas()) {
            PdfPCell celda = celda(columna, estilo.encabezadoTabla);
            celda.setBackgroundColor(EstiloPdf.OLIVA);
            resultado.addCell(celda);
        }
        for (List<String> fila : tabla.filas()) {
            for (String valor : fila) {
                resultado.addCell(celda(valor, estilo.texto));
            }
        }
        return resultado;
    }

    // Fondo crema claro con borde; etiqueta terracota, título en negrita y el texto
    private PdfPTable tarjeta(Tarjeta tarjeta) {
        if (tarjeta.tono() != null) {
            PdfPTable conColor = new PdfPTable(1);
            conColor.setWidthPercentage(100);
            conColor.addCell(lineaDeTiempo.caja(tarjeta.tono(), tarjeta.etiqueta(), tarjeta.titulo(), tarjeta.cuerpo()));
            return conColor;
        }
        Paragraph contenido = new Paragraph();
        contenido.add(new Phrase(valor(tarjeta.etiqueta()) + "\n", estilo.etiqueta));
        contenido.add(new Phrase(valor(tarjeta.titulo()), estilo.negrita));
        if (tarjeta.cuerpo() != null && !tarjeta.cuerpo().isBlank()) {
            contenido.add(new Phrase("\n" + tarjeta.cuerpo(), estilo.texto));
        }

        PdfPCell celda = new PdfPCell();
        celda.addElement(contenido);
        celda.setBackgroundColor(EstiloPdf.CREMA_CLARA);
        celda.setBorderColor(EstiloPdf.BORDE);
        celda.setPadding(8);
        celda.setPaddingTop(4);
        return unaColumna(celda, 6);
    }

    private PdfPCell celda(String texto, com.lowagie.text.Font fuente) {
        PdfPCell celda = new PdfPCell(new Phrase(valor(texto), fuente));
        celda.setBorderColor(EstiloPdf.BORDE);
        celda.setPadding(5);
        return celda;
    }

    private static PdfPTable unaColumna(PdfPCell celda, float espacioDespues) {
        PdfPTable tabla = new PdfPTable(1);
        tabla.setWidthPercentage(100);
        tabla.setSpacingAfter(espacioDespues);
        tabla.addCell(celda);
        return tabla;
    }

    private static String valor(String texto) {
        return texto == null ? "" : texto;
    }

    private static byte[] leerLogo() {
        try (InputStream entrada = PdfService.class.getResourceAsStream("/imagenes/logo.png")) {
            if (entrada == null) {
                throw new IllegalStateException("Falta el logo de TRAMA en resources/imagenes");
            }
            return entrada.readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo leer el logo de TRAMA", e);
        }
    }
}
