package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.dto.ResumenProyectoResponse;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.service.PdfService.Bloque;
import com.trama.tpo.demo.service.PdfService.Seccion;
import com.trama.tpo.demo.service.PdfService.Tabla;
import com.trama.tpo.demo.service.PdfService.Tarjeta;
import com.trama.tpo.demo.service.PdfService.Tono;

/**
 * 8.3: el perfil o "Conocelo en 5 minutos" en PDF, para llevar a una reunión.
 * Cualquier miembro, y solo con lo que esa persona puede ver: los aportes salen de
 * AporteService.listar y ResumenService, que ya filtran por visibilidad (y notas, 1.8).
 */
@Service
public class ExportacionPerfilService {

    public static final String CONOCELO = "conocelo";
    public static final String PERFIL = "perfil";

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final DateTimeFormatter FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // Las secciones de la portada, en el mismo orden que la pantalla (perfil.js)
    private static final List<Map.Entry<TipoAporte, String>> SECCIONES_PERFIL = List.of(
            Map.entry(TipoAporte.FORTALEZA, "Fortalezas"),
            Map.entry(TipoAporte.INTERES, "Intereses"),
            Map.entry(TipoAporte.COMUNICACION, "Comunicación"),
            Map.entry(TipoAporte.SENSORIAL, "Perfil sensorial"),
            Map.entry(TipoAporte.ESTRATEGIA, "Estrategias"),
            Map.entry(TipoAporte.RUTINA, "Rutinas"),
            Map.entry(TipoAporte.DESREGULACION, "Si se desregula"),
            Map.entry(TipoAporte.NOTA_PROFESIONAL, "Notas"));

    // Arriba de todo: qué color corresponde a cada tipo de aportador
    private static final Seccion LEYENDA = new Seccion(null, List.of(new PdfService.Leyenda()));

    private final PermisoService permisoService;
    private final ProyectoRepository proyectoRepository;
    private final AporteService aporteService;
    private final ResumenService resumenService;
    private final MiembroService miembroService;
    private final PdfService pdfService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public ExportacionPerfilService(
            PermisoService permisoService,
            ProyectoRepository proyectoRepository,
            AporteService aporteService,
            ResumenService resumenService,
            MiembroService miembroService,
            PdfService pdfService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {

        this.permisoService = permisoService;
        this.proyectoRepository = proyectoRepository;
        this.aporteService = aporteService;
        this.resumenService = resumenService;
        this.miembroService = miembroService;
        this.pdfService = pdfService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
    }

    // Primero el permiso y después la sección: alguien ajeno recibe 403, no 400
    public String verificarPedido(UUID proyectoId, String seccion) {

        permisoService.verificarMiembro(proyectoId);

        String normalizada = seccion == null ? "" : seccion.trim().toLowerCase(Locale.ROOT);
        if (!normalizada.equals(CONOCELO) && !normalizada.equals(PERFIL)) {
            throw new ApiException(
                    "SECCION_INVALIDA",
                    "Elegí qué exportar: conocelo o perfil",
                    HttpStatus.BAD_REQUEST);
        }
        return normalizada;
    }

    @Transactional
    public byte[] exportar(UUID proyectoId, String seccion) {

        String elegida = verificarPedido(proyectoId, seccion);
        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO", "No encontramos este proyecto", HttpStatus.NOT_FOUND));

        Map<UUID, Tono> tonos = miembroService.listarMiembros(proyectoId).stream()
                .collect(Collectors.toMap(MiembroResponse::getUsuarioId,
                        m -> ExportacionPdfService.tono(m.getRol()), (a, b) -> a));

        byte[] pdf = elegida.equals(CONOCELO)
                ? conocelo(proyecto, proyectoId, tonos)
                : perfil(proyecto, proyectoId, tonos);

        // 0.2: quién descargó qué (sin contenido)
        registroAccionService.registrar(usuarioActual.obtenerId(), proyectoId, AccionRegistro.VER,
                elegida.equals(CONOCELO) ? "PDF_CONOCELO" : "PDF_PERFIL");

        return pdf;
    }

    // "Conocelo en 5 minutos": las 6 secciones del resumen (2.8), en su mismo orden
    private byte[] conocelo(Proyecto proyecto, UUID proyectoId, Map<UUID, Tono> tonos) {

        ResumenProyectoResponse resumen = resumenService.obtener(proyectoId);

        List<Seccion> secciones = List.of(
                LEYENDA,
                seccion("Intereses", resumen.intereses(), tonos),
                seccion("Fortalezas", resumen.fortalezas(), tonos),
                seccion("Comunicación", resumen.comunicacion(), tonos),
                seccion("Perfil sensorial", resumen.sensorial(), tonos),
                seccion("Estrategias que funcionan", resumen.estrategias(), tonos),
                seccion("Si se desregula", resumen.desregulacion(), tonos));

        return pdfService.generar("Conocelo en 5 minutos: " + proyecto.getNombre(), secciones);
    }

    // El perfil: los datos del niño y una sección por cada sección de la portada
    private byte[] perfil(Proyecto proyecto, UUID proyectoId, Map<UUID, Tono> tonos) {

        List<AporteResponse> visibles = aporteService.listar(proyectoId, null, false);

        List<Seccion> secciones = new ArrayList<>();
        secciones.add(LEYENDA);
        secciones.add(new Seccion("Datos", List.of(new Tabla(List.of("Dato", "Valor"), List.of(
                List.of("Nombre", proyecto.getNombre() + " " + proyecto.getApellido()),
                List.of("Apodo", valor(proyecto.getApodo())),
                List.of("Fecha de nacimiento", fecha(proyecto.getFechaNacimiento())),
                List.of("Escuela", valor(proyecto.getEscuela())),
                List.of("Grado", valor(proyecto.getGrado())))))));

        for (Map.Entry<TipoAporte, String> s : SECCIONES_PERFIL) {
            List<AporteResponse> delTipo = visibles.stream().filter(a -> a.tipo() == s.getKey()).toList();
            // Notas solo aparece si la persona puede ver alguna (así no anuncia que existen)
            if (s.getKey() == TipoAporte.NOTA_PROFESIONAL && delTipo.isEmpty()) {
                continue;
            }
            secciones.add(seccion(s.getValue(), delTipo, tonos));
        }

        return pdfService.generar("Perfil de " + proyecto.getNombre(), secciones);
    }

    private static Seccion seccion(String titulo, List<AporteResponse> aportes, Map<UUID, Tono> tonos) {
        return new Seccion(titulo, aportes.stream()
                .<Bloque>map(a -> tarjeta(a, tonos.getOrDefault(a.autorId(), Tono.NEUTRO)))
                .toList());
    }

    // "02/11/2026 · María Pérez · Familia", título y texto (con los adjuntos por nombre)
    private static Tarjeta tarjeta(AporteResponse a, Tono tono) {
        String cuando = a.creadoEn() == null ? "-" : FECHA.format(a.creadoEn().atZone(ZONA));
        String quien = switch (tono) {
            case FAMILIA -> "Familia";
            case DOCENTE -> "Docente";
            case PROFESIONAL -> "Profesional";
            case NEUTRO -> "Ya no forma parte de la red";
        };
        String adjuntos = a.archivos() == null || a.archivos().isEmpty()
                ? ""
                : "\nAdjuntos: " + String.join(", ", a.archivos().stream().map(ArchivoResponse::nombreOriginal).toList());
        // Con el color de quien aportó, como en la línea de tiempo de la 8.1
        return new Tarjeta(cuando + " · " + valor(a.autorNombre()) + " · " + quien,
                a.titulo(), valor(a.contenido()) + adjuntos, tono);
    }

    private static String fecha(LocalDate fecha) {
        return fecha == null ? "-" : FECHA.format(fecha);
    }

    private static String valor(String texto) {
        return texto == null || texto.isBlank() ? "-" : texto;
    }
}
