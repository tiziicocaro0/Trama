package com.trama.tpo.demo.service.pdf;

import java.awt.Color;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import com.lowagie.text.Chunk;
import com.lowagie.text.Element;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPCellEvent;
import com.lowagie.text.pdf.PdfPTable;
import com.trama.tpo.demo.service.PdfService.Hito;
import com.trama.tpo.demo.service.PdfService.LineaDeTiempo;
import com.trama.tpo.demo.service.PdfService.Tono;

/**
 * Dibuja la línea de tiempo de los aportes (8.1), como la historia laboral de un CV:
 * agrupada por mes, con la fecha a la izquierda, un eje con un punto por aporte
 * y una caja del color de quien aportó (familia, docente o profesional).
 */
public class LineaDeTiempoPdf {

    private static final Locale ES = Locale.of("es", "AR");
    private static final float[] COLUMNAS = { 13, 5, 82 };

    private final EstiloPdf estilo;

    public LineaDeTiempoPdf(EstiloPdf estilo) {
        this.estilo = estilo;
    }

    // Una tabla por mes con el mes como fila de encabezado: OpenPDF nunca la deja sola
    // al pie de una página y, si el mes sigue en la próxima, la repite arriba.
    public List<Element> armar(LineaDeTiempo linea) {
        List<Element> elementos = new ArrayList<>();
        Paragraph referencias = leyenda();
        referencias.setSpacingAfter(6);
        elementos.add(referencias);

        PdfPTable mesActual = null;
        String nombreMes = null;
        for (Hito hito : linea.hitos()) {
            String mes = hito.fecha().getMonth().getDisplayName(TextStyle.FULL, ES).toUpperCase(ES)
                    + " " + hito.fecha().getYear();
            if (!mes.equals(nombreMes)) {
                nombreMes = mes;
                mesActual = new PdfPTable(COLUMNAS);
                mesActual.setWidthPercentage(100);
                mesActual.setSpacingAfter(4);
                mesActual.setHeaderRows(1);
                mesActual.addCell(celdaAncha(new Paragraph(mes, estilo.etiqueta), 8, 4));
                elementos.add(mesActual);
            }
            mesActual.addCell(fecha(hito));
            mesActual.addCell(eje());
            mesActual.addCell(caja(hito));
        }
        return elementos;
    }

    public static Color color(Tono tono) {
        return switch (tono) {
            case FAMILIA -> EstiloPdf.MIEL;
            case DOCENTE -> EstiloPdf.OLIVA;
            case PROFESIONAL -> EstiloPdf.AGUA;
            case NEUTRO -> EstiloPdf.BORDE;
        };
    }

    // Los tres colores, para que se entienda la línea de tiempo
    // También la usa PdfService para las tarjetas con color (8.3)
    public Paragraph leyenda() {
        Paragraph leyenda = new Paragraph();
        String[][] tonos = { { "FAMILIA", "Familia" }, { "DOCENTE", "Docentes" }, { "PROFESIONAL", "Profesionales" } };
        for (String[] tono : tonos) {
            Chunk muestra = new Chunk("    ", estilo.pie);
            muestra.setBackground(color(Tono.valueOf(tono[0])), 0, 1, 0, 1);
            leyenda.add(muestra);
            leyenda.add(new Chunk("  " + tono[1] + "      ", estilo.pie));
        }
        return leyenda;
    }

    private PdfPCell fecha(Hito hito) {
        String texto = String.format("%02d/%02d", hito.fecha().getDayOfMonth(), hito.fecha().getMonthValue());
        PdfPCell celda = new PdfPCell(new Phrase(texto, estilo.etiqueta));
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setHorizontalAlignment(Element.ALIGN_RIGHT);
        celda.setPaddingTop(8);
        celda.setPaddingRight(4);
        return celda;
    }

    // Columna del medio: la línea vertical terracota con un punto a la altura de la fecha
    private PdfPCell eje() {
        PdfPCell celda = new PdfPCell();
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setCellEvent(new DibujoEje());
        return celda;
    }

    private PdfPCell caja(Hito hito) {
        return caja(hito.tono(), hito.etiqueta(), hito.titulo(), hito.cuerpo());
    }

    // La caja del color de quien aportó. También la usan las tarjetas con color del perfil (8.3)
    public PdfPCell caja(Tono tono, String etiqueta, String titulo, String cuerpo) {
        Color color = color(tono);

        Paragraph contenido = new Paragraph();
        contenido.add(new Phrase(valor(etiqueta) + "\n", estilo.etiqueta));
        contenido.add(new Phrase(valor(titulo), estilo.negrita));
        if (cuerpo != null && !cuerpo.isBlank()) {
            contenido.add(new Phrase("\n" + cuerpo, estilo.texto));
        }

        PdfPCell interior = new PdfPCell();
        interior.addElement(contenido);
        interior.setUseVariableBorders(true);
        interior.setBackgroundColor(EstiloPdf.suave(color, 0.14f));
        interior.setBorderColor(EstiloPdf.suave(color, 0.45f));
        interior.setBorderWidth(0.6f);
        interior.setBorderColorLeft(color);
        interior.setBorderWidthLeft(4);
        interior.setPadding(8);
        interior.setPaddingTop(4);

        // Una tabla adentro para que la caja tenga aire abajo, sin pegarse a la siguiente
        PdfPTable envoltorio = new PdfPTable(1);
        envoltorio.setWidthPercentage(100);
        envoltorio.addCell(interior);
        PdfPCell celda = new PdfPCell(envoltorio);
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setPaddingBottom(8);
        return celda;
    }

    private static PdfPCell celdaAncha(Paragraph contenido, float arriba, float abajo) {
        PdfPCell celda = new PdfPCell();
        celda.addElement(contenido);
        celda.setColspan(3);
        celda.setBorder(Rectangle.NO_BORDER);
        celda.setPaddingTop(arriba);
        celda.setPaddingBottom(abajo);
        return celda;
    }

    private static String valor(String texto) {
        return texto == null ? "" : texto;
    }

    private static class DibujoEje implements PdfPCellEvent {
        @Override
        public void cellLayout(PdfPCell celda, Rectangle posicion, PdfContentByte[] lienzos) {
            PdfContentByte lienzo = lienzos[PdfPTable.LINECANVAS];
            float x = (posicion.getLeft() + posicion.getRight()) / 2;

            lienzo.setColorStroke(EstiloPdf.TERRACOTA);
            lienzo.setLineWidth(1.2f);
            lienzo.moveTo(x, posicion.getTop());
            lienzo.lineTo(x, posicion.getBottom());
            lienzo.stroke();

            lienzo.setColorFill(EstiloPdf.TERRACOTA);
            lienzo.circle(x, posicion.getTop() - 13, 3.5f);
            lienzo.fill();
        }
    }
}
