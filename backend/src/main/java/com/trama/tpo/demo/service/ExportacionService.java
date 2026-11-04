package com.trama.tpo.demo.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
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
import com.trama.tpo.demo.service.PdfService.Bloque;
import com.trama.tpo.demo.service.PdfService.Seccion;
import com.trama.tpo.demo.service.PdfService.Tabla;
import com.trama.tpo.demo.service.PdfService.Tarjeta;

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
                new Seccion("Perfil", List.of(new Tabla(List.of("Dato", "Valor"), List.of(
                        List.of("Nombre", p.nombre() + " " + p.apellido()),
                        List.of("Apodo", valor(p.apodo())),
                        List.of("Fecha de nacimiento", fecha(p.fechaNacimiento())),
                        List.of("Escuela", valor(p.escuela())),
                        List.of("Grado", valor(p.grado())))))),
                new Seccion("Miembros", datos.miembros().isEmpty() ? List.of() : List.of(new Tabla(
                        List.of("Nombre", "Rol", "Especialidades", "Administra"),
                        datos.miembros().stream().map(this::fila).toList()))),
                new Seccion("Aportes y notas", datos.aportes().stream().<Bloque>map(this::tarjeta).toList()),
                new Seccion("Eventos y reuniones", datos.eventos().stream().<Bloque>map(this::tarjeta).toList()),
                new Seccion("Acuerdos", datos.acuerdos().isEmpty() ? List.of() : List.of(new Tabla(
                        List.of("Acuerdo", "Responsable", "Revisión", "Estado"),
                        datos.acuerdos().stream().map(this::fila).toList()))));

        return pdfService.generar("Información de " + p.nombre(), secciones);
    }

    // ---------- Bloques del PDF ----------

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

    private Tarjeta tarjeta(AporteResponse a) {
        String fecha = a.creadoEn() == null ? "-" : FECHA.format(a.creadoEn().atZone(ZONA));
        String archivos = a.archivos() == null || a.archivos().isEmpty()
                ? ""
                : "\nAdjuntos: " + String.join(", ", a.archivos().stream().map(ArchivoResponse::nombreOriginal).toList());
        String etiqueta = legible(a.tipo().name()).toUpperCase(Locale.ROOT) + " · " + fecha + " · "
                + valor(a.autorNombre()) + (Boolean.TRUE.equals(a.archivado()) ? " · ARCHIVADO" : "");
        return new Tarjeta(etiqueta, a.titulo(), valor(a.contenido()) + archivos);
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
