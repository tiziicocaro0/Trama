package com.trama.tpo.demo.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.entity.dto.AcuerdoResponse;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.entity.dto.ExportacionResponse;
import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.service.PdfService.Seccion;

/**
 * Descargar toda la información del niño en JSON o PDF (8.1), para ejercer el derecho de acceso.
 * Solo los tutores. Queda en la auditoría como VER / EXPORTACION.
 */
@Service
public class ExportacionService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PermisoService permisoService;
    private final ProyectoRepository proyectoRepository;
    private final MiembroService miembroService;
    private final AporteService aporteService;
    private final EventoService eventoService;
    private final AcuerdoService acuerdoService;
    private final PdfService pdfService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public ExportacionService(
            PermisoService permisoService,
            ProyectoRepository proyectoRepository,
            MiembroService miembroService,
            AporteService aporteService,
            EventoService eventoService,
            AcuerdoService acuerdoService,
            PdfService pdfService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {

        this.permisoService = permisoService;
        this.proyectoRepository = proyectoRepository;
        this.miembroService = miembroService;
        this.aporteService = aporteService;
        this.eventoService = eventoService;
        this.acuerdoService = acuerdoService;
        this.pdfService = pdfService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
    }

    // Primero el permiso y después el formato: alguien que no es tutor recibe 403, no 400
    public String verificarPedido(UUID proyectoId, String formato) {

        permisoService.verificarTutor(proyectoId);

        String normalizado = formato == null ? "" : formato.trim().toLowerCase(Locale.ROOT);
        if (!normalizado.equals("json") && !normalizado.equals("pdf")) {
            throw new ApiException(
                    "FORMATO_INVALIDO",
                    "Elegí el formato: json o pdf",
                    HttpStatus.BAD_REQUEST);
        }
        return normalizado;
    }

    @Transactional
    public ExportacionResponse exportar(UUID proyectoId) {

        permisoService.verificarTutor(proyectoId);

        // Directo y no con ProyectoService.obtener: eso registraría además una visita a la portada
        ProyectoResponse proyecto = ProyectoResponse.from(
                proyectoRepository.findById(proyectoId)
                        .orElseThrow(() -> new ApiException(
                                "PROYECTO_NO_ENCONTRADO", "No encontramos este proyecto", HttpStatus.NOT_FOUND)),
                permisoService.puedeEditar(proyectoId),
                permisoService.puedeCargarNotas(proyectoId));

        List<AporteResponse> aportes = Stream.concat(
                        aporteService.listar(proyectoId, null, false).stream(),
                        aporteService.listar(proyectoId, null, true).stream())
                .toList();

        List<EventoResponse> eventos = eventoService.listarParaExportar(proyectoId);

        List<AcuerdoResponse> acuerdos = eventos.stream()
                .filter(evento -> "REUNION".equals(evento.tipo()))
                .flatMap(reunion -> acuerdoService.listar(proyectoId, reunion.id()).stream())
                .toList();

        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.VER, "EXPORTACION");

        return new ExportacionResponse(
                Instant.now(),
                proyecto,
                miembroService.listarMiembros(proyectoId),
                aportes,
                eventos,
                acuerdos);
    }

    @Transactional
    public byte[] exportarPdf(UUID proyectoId) {

        ExportacionResponse datos = exportar(proyectoId);
        ProyectoResponse p = datos.proyecto();

        List<Seccion> secciones = List.of(
                new Seccion("Perfil", List.of(
                        "Nombre: " + p.nombre() + " " + p.apellido(),
                        "Apodo: " + valor(p.apodo()),
                        "Fecha de nacimiento: " + fecha(p.fechaNacimiento()),
                        "Escuela: " + valor(p.escuela()),
                        "Grado: " + valor(p.grado()))),
                new Seccion("Miembros", datos.miembros().stream().map(this::linea).toList()),
                new Seccion("Aportes y notas", datos.aportes().stream().map(this::linea).toList()),
                new Seccion("Eventos y reuniones", datos.eventos().stream().flatMap(this::lineas).toList()),
                new Seccion("Acuerdos", datos.acuerdos().stream().map(this::linea).toList()));

        return pdfService.generar("Información de " + p.nombre() + " en TRAMA", secciones);
    }

    // ---------- Renglones del PDF ----------

    private String linea(MiembroResponse m) {
        String especialidades = m.getEspecialidades() == null || m.getEspecialidades().isEmpty()
                ? ""
                : " (" + String.join(", ", m.getEspecialidades().stream()
                        .map(e -> legible(e.especialidad())).toList()) + ")";
        return m.getNombre() + " " + m.getApellido() + ": " + legible(m.getRol().name())
                + especialidades + (Boolean.TRUE.equals(m.getEsAdmin()) ? ", administra" : "");
    }

    private String linea(AporteResponse a) {
        String fecha = a.creadoEn() == null ? "" : FECHA.format(a.creadoEn().atZone(ZONA));
        String archivos = a.archivos() == null || a.archivos().isEmpty()
                ? ""
                : " Adjuntos: " + String.join(", ", a.archivos().stream().map(ArchivoResponse::nombreOriginal).toList()) + ".";
        return "[" + legible(a.tipo().name()) + "] " + a.titulo()
                + " (" + fecha + ", " + valor(a.autorNombre()) + ")"
                + (Boolean.TRUE.equals(a.archivado()) ? " [archivado]" : "")
                + ": " + valor(a.contenido()) + archivos;
    }

    private Stream<String> lineas(EventoResponse e) {
        List<String> lineas = new ArrayList<>();
        String cuando = Boolean.TRUE.equals(e.recurrente())
                ? "todas las semanas desde el " + fecha(e.fecha())
                : fecha(e.fecha());
        lineas.add("[" + legible(e.tipo()) + "] " + e.titulo() + " (" + cuando + ")"
                + (e.descripcion() == null || e.descripcion().isBlank() ? "" : ": " + e.descripcion()));
        if (e.acta() != null && !e.acta().isBlank()) {
            lineas.add("    Acta: " + e.acta());
        }
        return lineas.stream();
    }

    private String linea(AcuerdoResponse a) {
        return a.descripcion() + " (responsable: " + a.responsableNombre()
                + ", revisión: " + fecha(a.fechaRevision())
                + (Boolean.TRUE.equals(a.cumplido()) ? ", cumplido" : ", pendiente") + ")";
    }

    private static String legible(String constante) {
        if (constante == null) {
            return "";
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
