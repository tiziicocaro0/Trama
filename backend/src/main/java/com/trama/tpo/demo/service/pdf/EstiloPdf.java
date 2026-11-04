package com.trama.tpo.demo.service.pdf;

import java.awt.Color;
import java.io.IOException;
import java.io.InputStream;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.BaseFont;

/**
 * Identidad visual de TRAMA en los PDF (8.1): los colores de docs/branding.md
 * y las fuentes de la app (Handlee para títulos, Nunito Sans para el texto), embebidas.
 */
public final class EstiloPdf {

    // Los mismos valores que los tokens de tema.css (ver docs/branding.md)
    public static final Color CREMA = new Color(0xF1, 0xE4, 0xCD);
    public static final Color CREMA_CLARA = new Color(0xFA, 0xF4, 0xEA);
    public static final Color TERRACOTA = new Color(0x96, 0x34, 0x17);
    public static final Color OLIVA = new Color(0x4B, 0x4F, 0x21);
    public static final Color TEXTO = new Color(0x2E, 0x2E, 0x2E);
    public static final Color TEXTO_SUAVE = new Color(0x6B, 0x6B, 0x6B);
    public static final Color BORDE = new Color(0xD9, 0xD4, 0xC8);

    public final Font titulo;
    public final Font subtitulo;
    public final Font texto;
    public final Font negrita;
    public final Font etiqueta;
    public final Font encabezadoTabla;
    public final Font pie;
    public final BaseFont baseTexto;

    public EstiloPdf() {
        BaseFont handlee = cargar("Handlee-Regular.ttf");
        BaseFont nunito = cargar("NunitoSans-Regular.ttf");
        BaseFont nunitoBold = cargar("NunitoSans-Bold.ttf");

        baseTexto = nunito;
        titulo = new Font(handlee, 24, Font.NORMAL, TERRACOTA);
        subtitulo = new Font(nunitoBold, 13, Font.NORMAL, OLIVA);
        texto = new Font(nunito, 10, Font.NORMAL, TEXTO);
        negrita = new Font(nunitoBold, 10, Font.NORMAL, TEXTO);
        etiqueta = new Font(nunitoBold, 8, Font.NORMAL, TERRACOTA);
        encabezadoTabla = new Font(nunitoBold, 9, Font.NORMAL, Color.WHITE);
        pie = new Font(nunito, 8, Font.NORMAL, TEXTO_SUAVE);
    }

    // Desde el classpath (resources/fuentes), embebida y con Unicode para tildes y ñ
    private static BaseFont cargar(String archivo) {
        try (InputStream entrada = EstiloPdf.class.getResourceAsStream("/fuentes/" + archivo)) {
            if (entrada == null) {
                throw new IllegalStateException("Falta la fuente " + archivo);
            }
            return BaseFont.createFont(archivo, BaseFont.IDENTITY_H, BaseFont.EMBEDDED,
                    true, entrada.readAllBytes(), null);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo cargar la fuente " + archivo, e);
        }
    }
}
