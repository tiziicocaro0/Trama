package com.trama.datosprueba;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

// Imágenes y PDFs ficticios para los datos de prueba, generados en el momento (sin archivos ni librerías).
// Los colores son los de tema.css, para que los recursos se vean de TRAMA.
final class ArchivosDePrueba {

    static final Color CREMA = new Color(0xF1E4CD);
    static final Color SUPERFICIE = new Color(0xFAF3E3);
    static final Color TERRACOTA = new Color(0x963417);
    static final Color OLIVA = new Color(0x4B4F21);
    static final Color AGUA = new Color(0x628981);
    static final Color MIEL = new Color(0xCF893A);
    static final Color TEXTO = new Color(0x2E2E2E);

    private ArchivosDePrueba() {
    }

    // Un cartel tipo pictograma, cuadrado (así se ve entero en la galería): título arriba
    // y los pasos numerados en una grilla de dos columnas
    static byte[] pictograma(String titulo, String[] pasos, Color color) {
        int lado = 1000;
        BufferedImage imagen = new BufferedImage(lado, lado, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = imagen.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        g.setColor(CREMA);
        g.fillRect(0, 0, lado, lado);
        g.setColor(color);
        g.fillRoundRect(50, 50, lado - 100, 160, 60, 60);
        g.setColor(SUPERFICIE);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 72));
        centrar(g, titulo, lado / 2, 157);

        int columnas = Math.min(2, pasos.length);
        int filas = (pasos.length + 1) / 2;
        int margen = 50;
        int separacion = 40;
        int arriba = 250;
        int ancho = (lado - 2 * margen - (columnas - 1) * separacion) / columnas;
        int alto = (lado - arriba - margen - (filas - 1) * separacion) / filas;
        for (int i = 0; i < pasos.length; i++) {
            int x = margen + (i % 2) * (ancho + separacion);
            int y = arriba + (i / 2) * (alto + separacion);
            int centroX = x + ancho / 2;
            g.setColor(SUPERFICIE);
            g.fillRoundRect(x, y, ancho, alto, 50, 50);
            g.setColor(color);
            g.setStroke(new BasicStroke(8));
            g.drawRoundRect(x, y, ancho, alto, 50, 50);
            int circulo = Math.min(150, alto / 2);
            int arribaCirculo = y + alto / 2 - circulo + 10;
            g.fillOval(centroX - circulo / 2, arribaCirculo, circulo, circulo);
            g.setColor(SUPERFICIE);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, circulo * 3 / 5));
            centrar(g, String.valueOf(i + 1), centroX, arribaCirculo + circulo * 3 / 4);
            g.setColor(TEXTO);
            g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 56));
            centrar(g, pasos[i], centroX, arribaCirculo + circulo + 80);
        }
        g.dispose();

        try (ByteArrayOutputStream salida = new ByteArrayOutputStream()) {
            ImageIO.write(imagen, "png", salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void centrar(Graphics2D g, String texto, int centroX, int baseY) {
        FontMetrics metricas = g.getFontMetrics();
        g.drawString(texto, centroX - metricas.stringWidth(texto) / 2, baseY);
    }

    // Un PDF de una página armado a mano: título y una línea de texto
    static byte[] pdf(String titulo, String texto) {
        String contenido = "BT /F1 22 Tf 72 760 Td (" + escapar(titulo) + ") Tj ET\n"
                + "BT /F1 13 Tf 72 720 Td (" + escapar(texto) + ") Tj ET\n";
        int largoContenido = contenido.getBytes(StandardCharsets.ISO_8859_1).length;
        List<String> objetos = List.of(
                "<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R "
                        + "/Resources << /Font << /F1 5 0 R >> >> >>",
                "<< /Length " + largoContenido + " >>\nstream\n" + contenido + "endstream",
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");

        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        List<Integer> posiciones = new ArrayList<>();
        for (int i = 0; i < objetos.size(); i++) {
            posiciones.add(largo(pdf));
            pdf.append(i + 1).append(" 0 obj\n").append(objetos.get(i)).append("\nendobj\n");
        }
        int inicioXref = largo(pdf);
        pdf.append("xref\n0 ").append(objetos.size() + 1).append("\n0000000000 65535 f \n");
        for (int posicion : posiciones) {
            pdf.append(String.format("%010d 00000 n \n", posicion));
        }
        pdf.append("trailer\n<< /Size ").append(objetos.size() + 1).append(" /Root 1 0 R >>\n")
                .append("startxref\n").append(inicioXref).append("\n%%EOF\n");
        return pdf.toString().getBytes(StandardCharsets.ISO_8859_1);
    }

    private static int largo(StringBuilder texto) {
        return texto.toString().getBytes(StandardCharsets.ISO_8859_1).length;
    }

    private static String escapar(String texto) {
        return texto.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }
}
