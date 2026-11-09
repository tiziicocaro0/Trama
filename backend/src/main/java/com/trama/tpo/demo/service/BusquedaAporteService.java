package com.trama.tpo.demo.service;

import com.trama.tpo.demo.entity.dto.ResultadoBusquedaResponse;
import com.trama.tpo.demo.exceptions.ApiException;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BusquedaAporteService {
    private final AporteService aporteService;
    private final PermisoService permisoService;

    public BusquedaAporteService(AporteService aporteService, PermisoService permisoService) {
        this.aporteService = aporteService;
        this.permisoService = permisoService;
    }

    @Transactional(readOnly = true)
    public List<ResultadoBusquedaResponse> buscar(UUID proyectoId, String q) {
        permisoService.verificarMiembro(proyectoId);
        String consulta = normalizar(q == null ? "" : q).texto();
        if (consulta.isBlank() || consulta.length() > 200) {
            throw new ApiException("BUSQUEDA_INVALIDA", "Ingresá una búsqueda de hasta 200 caracteres", HttpStatus.BAD_REQUEST);
        }
        return aporteService.obtenerVisibles(proyectoId, null, false).stream()
                .map(aporte -> {
                    TextoNormalizado contenido = normalizar(aporte.getContenido());
                    int posicion = contenido.texto().indexOf(consulta);
                    boolean coincideTitulo = normalizar(aporte.getTitulo()).texto().contains(consulta);
                    if (!coincideTitulo && posicion < 0) return null;
                    String fragmento = posicion < 0 ? null : fragmento(aporte.getContenido(), contenido, posicion, consulta.length());
                    return new ResultadoBusquedaResponse(aporte.getId(), proyectoId, aporte.getTipo(), aporte.getTitulo(), fragmento);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    private record TextoNormalizado(String texto, List<Integer> indices) {}

    private static TextoNormalizado normalizar(String valor) {
        if (valor == null) return new TextoNormalizado("", List.of());
        StringBuilder texto = new StringBuilder();
        List<Integer> indices = new ArrayList<>();
        boolean espacio = false;
        for (int i = 0; i < valor.length();) {
            int codigo = valor.codePointAt(i);
            if (Character.isWhitespace(codigo) || Character.isSpaceChar(codigo)) {
                espacio = texto.length() > 0;
            } else {
                String parte = Normalizer.normalize(new String(Character.toChars(codigo)), Normalizer.Form.NFD)
                        .replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
                if (!parte.isEmpty()) {
                    if (espacio) { texto.append(' '); indices.add(i); }
                    espacio = false;
                    texto.append(parte);
                    for (int j = 0; j < parte.length(); j++) indices.add(i);
                }
            }
            i += Character.charCount(codigo);
        }
        return new TextoNormalizado(texto.toString(), indices);
    }

    private static String fragmento(String original, TextoNormalizado normalizado, int posicion, int longitud) {
        int inicioCoincidencia = normalizado.indices().get(posicion);
        int finCoincidencia = normalizado.indices().get(posicion + longitud - 1);
        finCoincidencia += Character.charCount(original.codePointAt(finCoincidencia));
        int inicio = Math.max(0, inicioCoincidencia - 70);
        int fin = Math.min(original.length(), finCoincidencia + 70);
        if (inicio > 0 && Character.isLowSurrogate(original.charAt(inicio))) inicio--;
        if (fin < original.length() && Character.isLowSurrogate(original.charAt(fin))) fin++;
        return (inicio > 0 ? "…" : "") + original.substring(inicio, fin).trim() + (fin < original.length() ? "…" : "");
    }
}
