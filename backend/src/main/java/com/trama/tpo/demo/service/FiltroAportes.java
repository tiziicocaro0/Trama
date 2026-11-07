package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.service.PdfService.Tono;

/**
 * Qué aportes entran en el PDF de la exportación (8.1). Vacío = todos ("exportar todo").
 * tipos: FAMILIA, DOCENTE o PROFESIONAL. usuarios: autores elegidos.
 */
public record FiltroAportes(LocalDate desde, LocalDate hasta, Set<Tono> tipos, Set<UUID> usuarios) {

    public static final FiltroAportes TODOS = new FiltroAportes(null, null, Set.of(), Set.of());

    public static FiltroAportes crear(LocalDate desde, LocalDate hasta, List<String> tipos, List<UUID> usuarios) {

        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new ApiException(
                    "RANGO_INVALIDO",
                    "La fecha de inicio no puede ser posterior a la fecha de fin",
                    HttpStatus.BAD_REQUEST);
        }

        Set<Tono> tonos = tipos == null ? Set.of() : tipos.stream()
                .map(tipo -> tipo.trim().toUpperCase(Locale.ROOT))
                .map(FiltroAportes::tono)
                .collect(Collectors.toSet());

        return new FiltroAportes(desde, hasta, tonos, usuarios == null ? Set.of() : Set.copyOf(usuarios));
    }

    public boolean esTodo() {
        return desde == null && hasta == null && tipos.isEmpty() && usuarios.isEmpty();
    }

    // Quien ya no es miembro (NEUTRO) solo entra cuando no se eligieron tipos ni personas
    public boolean incluye(LocalDate fecha, Tono tono, UUID autorId) {
        return (desde == null || !fecha.isBefore(desde))
                && (hasta == null || !fecha.isAfter(hasta))
                && (tipos.isEmpty() || tipos.contains(tono))
                && (usuarios.isEmpty() || usuarios.contains(autorId));
    }

    private static Tono tono(String tipo) {
        return switch (tipo) {
            case "FAMILIA" -> Tono.FAMILIA;
            case "DOCENTE" -> Tono.DOCENTE;
            case "PROFESIONAL" -> Tono.PROFESIONAL;
            default -> throw new ApiException(
                    "TIPO_INVALIDO",
                    "Los tipos de aportador son FAMILIA, DOCENTE o PROFESIONAL",
                    HttpStatus.BAD_REQUEST);
        };
    }
}
