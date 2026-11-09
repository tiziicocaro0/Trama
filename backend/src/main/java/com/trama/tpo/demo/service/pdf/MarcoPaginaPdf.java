package com.trama.tpo.demo.service.pdf;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Image;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.ColumnText;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfTemplate;
import com.lowagie.text.pdf.PdfWriter;

/**
 * Lo que se repite en cada página (8.1): el logo y la fecha arriba con una línea terracota,
 * y al pie "Generado por TRAMA" y "Página X de Y".
 */
public class MarcoPaginaPdf extends PdfPageEventHelper {

    private static final float ALTO_LOGO = 30;

    private final EstiloPdf estilo;
    private final Image logo;
    private final String fecha;
    private PdfTemplate totalPaginas;

    public MarcoPaginaPdf(EstiloPdf estilo, Image logo, String fecha) {
        this.estilo = estilo;
        this.logo = logo;
        this.fecha = fecha;
    }

    @Override
    public void onOpenDocument(PdfWriter writer, Document documento) {
        // El total recién se conoce al cerrar: se reserva un lugar y se completa al final
        totalPaginas = writer.getDirectContent().createTemplate(30, 12);
    }

    @Override
    public void onEndPage(PdfWriter writer, Document documento) {
        PdfContentByte lienzo = writer.getDirectContent();
        float izquierda = documento.left();
        float derecha = documento.right();
        float arriba = documento.getPageSize().getHeight() - 28;

        // Encabezado: logo, fecha y línea terracota
        Image copia = Image.getInstance(logo);
        copia.scaleToFit(ALTO_LOGO * 2, ALTO_LOGO);
        copia.setAbsolutePosition(izquierda, arriba - ALTO_LOGO);
        lienzo.addImage(copia);

        ColumnText.showTextAligned(lienzo, Element.ALIGN_RIGHT,
                new Phrase(fecha, estilo.pie), derecha, arriba - ALTO_LOGO / 2, 0);

        lienzo.setColorStroke(EstiloPdf.TERRACOTA);
        lienzo.setLineWidth(1.2f);
        lienzo.moveTo(izquierda, arriba - ALTO_LOGO - 6);
        lienzo.lineTo(derecha, arriba - ALTO_LOGO - 6);
        lienzo.stroke();

        // Pie: autoría y número de página
        float pie = documento.bottom() - 24;
        ColumnText.showTextAligned(lienzo, Element.ALIGN_LEFT,
                new Phrase("Generado por TRAMA", estilo.pie), izquierda, pie, 0);

        String pagina = "Página " + writer.getPageNumber() + " de ";
        float ancho = estilo.baseTexto.getWidthPoint(pagina, estilo.pie.getSize());
        ColumnText.showTextAligned(lienzo, Element.ALIGN_LEFT,
                new Phrase(pagina, estilo.pie), derecha - ancho - 14, pie, 0);
        lienzo.addTemplate(totalPaginas, derecha - 14, pie);
    }

    // Al cerrar, el número de página ya avanzó una más que la última
    @Override
    public void onCloseDocument(PdfWriter writer, Document documento) {
        ColumnText.showTextAligned(totalPaginas, Element.ALIGN_LEFT,
                new Phrase(String.valueOf(writer.getPageNumber() - 1), estilo.pie), 0, 0, 0);
    }
}
