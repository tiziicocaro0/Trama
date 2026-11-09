package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.entity.dto.AcuerdoResponse;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.entity.dto.ExportacionResponse;
import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.service.PdfService.Bloque;
import com.trama.tpo.demo.service.PdfService.Hito;
import com.trama.tpo.demo.service.PdfService.LineaDeTiempo;
import com.trama.tpo.demo.service.PdfService.Seccion;
import com.trama.tpo.demo.service.PdfService.Tabla;
import com.trama.tpo.demo.service.PdfService.Tarjeta;
import com.trama.tpo.demo.service.PdfService.Texto;
import com.trama.tpo.demo.service.PdfService.Tono;

/**
 * El PDF de "Descargar todos los datos" (8.1): los aportes van en una línea de tiempo,
 * con una caja del color de quien aportó, y se pueden filtrar por fechas, tipos y personas.
 * El resto (perfil, miembros, eventos y acuerdos) va siempre completo.
 */
@Service
public class ExportacionPdfService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ExportacionService exportacionService;
    private final PdfService pdfService;

    public ExportacionPdfService(ExportacionService exportacionService, PdfService pdfService) {
        this.exportacionService = exportacionService;
        this.pdfService = pdfService;
    }

    @Transactional
    public byte[] exportar(UUID proyectoId, FiltroAportes filtro) {

        // Verifica que sea tutor y deja la descarga en la auditoría
        ExportacionResponse datos = exportacionService.exportar(proyectoId);
        ProyectoResponse p = datos.proyecto();

        Map<UUID, Tono> tonos = datos.miembros().stream()
                .collect(Collectors.toMap(MiembroResponse::getUsuarioId, m -> tono(m.getRol()), (a, b) -> a));

        List<Hito> hitos = datos.aportes().stream()
                .filter(a -> a.creadoEn() != null)
                .filter(a -> filtro.incluye(diaDe(a), tonos.getOrDefault(a.autorId(), Tono.NEUTRO), a.autorId()))
                .sorted(Comparator.comparing(AporteResponse::creadoEn).reversed())
                .map(a -> hito(a, tonos.getOrDefault(a.autorId(), Tono.NEUTRO)))
                .toList();

        List<Bloque> aportes = new ArrayList<>();
        aportes.add(new Texto(resumen(filtro, hitos.size())));
        if (!hitos.isEmpty()) {
            aportes.add(new LineaDeTiempo(hitos));
        }

        List<Seccion> secciones = List.of(
                new Seccion("Perfil", List.of(new Tabla(List.of("Dato", "Valor"), List.of(
                        List.of("Nombre", p.nombre() + " " + p.apellido()),
                        List.of("Apodo", valor(p.apodo())),
                        List.of("Fecha de nacimiento", fecha(p.fechaNacimiento())),
                        List.of("Escuela", valor(p.escuela())),
                        List.of("Grado", valor(p.grado())))))),
                new Seccion("Miembros", datos.miembros().isEmpty() ? List.of() : List.of(new Tabla(
                        List.of("Nombre", "Rol", "Especialidades", "Administra"),
                        datos.miembros().stream().map(this::fila).toList()))),
                new Seccion("Aportes y notas", aportes),
                new Seccion("Eventos y reuniones", datos.eventos().stream().<Bloque>map(this::tarjeta).toList()),
                new Seccion("Acuerdos", datos.acuerdos().isEmpty() ? List.of() : List.of(new Tabla(
                        List.of("Acuerdo", "Responsable", "Revisión", "Estado"),
                        datos.acuerdos().stream().map(this::fila).toList()))));

        return pdfService.generar("Información de " + p.nombre(), secciones);
    }

    // Familia (tutores y familiares), docentes (educación) o profesionales (salud)
    static Tono tono(Rol rol) {
        return switch (rol) {
            case TUTOR, FAMILIAR -> Tono.FAMILIA;
            case EDUCACION -> Tono.DOCENTE;
            case SALUD -> Tono.PROFESIONAL;
        };
    }

    // ---------- Línea de tiempo ----------

    private Hito hito(AporteResponse a, Tono tono) {
        String archivos = a.archivos() == null || a.archivos().isEmpty()
                ? ""
                : "\nAdjuntos: " + String.join(", ", a.archivos().stream().map(ArchivoResponse::nombreOriginal).toList());
        String etiqueta = legible(a.tipo().name()).toUpperCase(Locale.ROOT) + " · " + valor(a.autorNombre())
                + " · " + nombreTono(tono) + (Boolean.TRUE.equals(a.archivado()) ? " · ARCHIVADO" : "");
        return new Hito(diaDe(a), tono, etiqueta, a.titulo(),
                valor(a.contenido()) + archivos);
    }

    // El día del aporte, en hora de Argentina
    private static LocalDate diaDe(AporteResponse a) {
        return a.creadoEn().atZone(ZONA).toLocalDate();
    }

    private static String resumen(FiltroAportes filtro, int cantidad) {
        if (filtro.esTodo()) {
            return "Todos los aportes (" + cantidad + "), del más reciente al más antiguo.";
        }
        List<String> partes = new ArrayList<>();
        if (filtro.desde() != null || filtro.hasta() != null) {
            partes.add("del " + (filtro.desde() == null ? "inicio" : fecha(filtro.desde()))
                    + " al " + (filtro.hasta() == null ? "día de hoy" : fecha(filtro.hasta())));
        }
        if (!filtro.tipos().isEmpty()) {
            partes.add(filtro.tipos().stream().sorted().map(ExportacionPdfService::nombreTono)
                    .collect(Collectors.joining(", ")));
        }
        if (!filtro.usuarios().isEmpty()) {
            partes.add(filtro.usuarios().size() + (filtro.usuarios().size() == 1 ? " persona elegida" : " personas elegidas"));
        }
        return "Aportes filtrados (" + cantidad + "): " + String.join(" · ", partes) + ".";
    }

    private static String nombreTono(Tono tono) {
        return switch (tono) {
            case FAMILIA -> "Familia";
            case DOCENTE -> "Docente";
            case PROFESIONAL -> "Profesional";
            case NEUTRO -> "Ya no forma parte de la red";
        };
    }

    // ---------- Resto del PDF ----------

    private List<String> fila(MiembroResponse m) {
        String especialidades = m.getEspecialidades() == null || m.getEspecialidades().isEmpty()
                ? "-"
                : String.join(", ", m.getEspecialidades().stream().map(e -> legible(e.especialidad())).toList());
        return List.of(
                m.getNombre() + " " + m.getApellido(),
                legible(m.getRol().name()),
                especialidades,
                Boolean.TRUE.equals(m.getEsAdmin()) ? "Sí" : "No");
    }

    private Tarjeta tarjeta(EventoResponse e) {
        String cuando = Boolean.TRUE.equals(e.recurrente())
                ? "todas las semanas desde el " + fecha(e.fecha())
                : fecha(e.fecha());
        String cuerpo = (e.descripcion() == null || e.descripcion().isBlank() ? "" : e.descripcion())
                + (e.acta() == null || e.acta().isBlank() ? "" : "\nActa: " + e.acta());
        return new Tarjeta(legible(e.tipo()).toUpperCase(Locale.ROOT) + " · " + cuando, e.titulo(), cuerpo.strip());
    }

    private List<String> fila(AcuerdoResponse a) {
        return List.of(
                a.descripcion(),
                valor(a.responsableNombre()),
                fecha(a.fechaRevision()),
                Boolean.TRUE.equals(a.cumplido()) ? "Cumplido" : "Pendiente");
    }

    // Los códigos que llevan tilde o un nombre más claro; el resto se arma solo
    private static final Map<String, String> NOMBRES = Map.ofEntries(
            Map.entry("INTERES", "Interés"),
            Map.entry("COMUNICACION", "Comunicación"),
            Map.entry("DESREGULACION", "Desregulación"),
            Map.entry("OBSERVACION", "Observación"),
            Map.entry("SUGERENCIA", "Sugerencia"),
            Map.entry("ABC", "Registro ABC"),
            Map.entry("EDUCACION", "Educación"),
            Map.entry("REUNION", "Reunión"),
            Map.entry("COMUN", "Evento"));

    private static String legible(String constante) {
        if (constante == null) {
            return "";
        }
        if (NOMBRES.containsKey(constante)) {
            return NOMBRES.get(constante);
        }
        String texto = constante.replace('_', ' ').toLowerCase(Locale.ROOT);
        return Character.toUpperCase(texto.charAt(0)) + texto.substring(1);
    }

    private static String fecha(LocalDate fecha) {
        return fecha == null ? "-" : FECHA.format(fecha);
    }

    private static String valor(String texto) {
        return texto == null || texto.isBlank() ? "-" : texto;
    }
}
