package com.trama.tpo.demo.contrato;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Lee el código del frontend para los tests de contrato front ↔ back.
 * Los tests corren desde backend/, así que el front está en la carpeta hermana.
 */
final class FuenteFrontend {

    private static final Path RAIZ = Path.of("..", "frontend", "src");
    private static final Pattern VALOR_EN_MAYUSCULAS = Pattern.compile("['\"]([A-Z][A-Z_]+)['\"]");

    private FuenteFrontend() {
    }

    /** Contenido de un archivo del front, relativo a frontend/src. */
    static String leer(String rutaRelativa) {
        Path archivo = RAIZ.resolve(rutaRelativa);
        try {
            return Files.readString(archivo, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo leer " + archivo, e);
        }
    }

    /** Código de todos los archivos .js/.jsx del front que no son tests. */
    static String todoElCodigo() {
        try (Stream<Path> archivos = Files.walk(RAIZ)) {
            return archivos
                    .filter(p -> p.toString().matches(".*\\.jsx?$"))
                    .filter(p -> !p.toString().contains(".test."))
                    .map(p -> {
                        try {
                            return Files.readString(p, StandardCharsets.UTF_8);
                        } catch (IOException e) {
                            throw new UncheckedIOException(e);
                        }
                    })
                    .collect(Collectors.joining("\n"));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Texto entre dos marcas (la primera aparición de cada una). */
    static String entre(String texto, String desde, String hasta) {
        int inicio = texto.indexOf(desde);
        assertTrue(inicio >= 0, "No se encontró '" + desde + "' en el frontend");
        int fin = texto.indexOf(hasta, inicio + desde.length());
        assertTrue(fin >= 0, "No se encontró '" + hasta + "' en el frontend");
        return texto.substring(inicio + desde.length(), fin);
    }

    /** Valores tipo enum ('TODOS', "SOLO_SALUD"...) que aparecen en el texto. */
    static Set<String> valoresEnMayusculas(String texto) {
        return todasLasCoincidencias(VALOR_EN_MAYUSCULAS, texto);
    }

    /** Primer grupo de cada coincidencia del patrón. */
    static Set<String> todasLasCoincidencias(Pattern patron, String texto) {
        Set<String> valores = new LinkedHashSet<>();
        Matcher m = patron.matcher(texto);
        while (m.find()) {
            valores.add(m.group(1));
        }
        return valores;
    }

    /** Primer grupo de la primera coincidencia, como número. */
    static int numero(String texto, String regex) {
        Matcher m = Pattern.compile(regex).matcher(texto);
        if (!m.find()) {
            fail("No se encontró /" + regex + "/ en el frontend");
        }
        return Integer.parseInt(m.group(1));
    }

    /** Nombres de los valores de un enum de Java. */
    static Set<String> nombres(Class<? extends Enum<?>> tipoEnum) {
        return Arrays.stream(tipoEnum.getEnumConstants())
                .map(Enum::name)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
