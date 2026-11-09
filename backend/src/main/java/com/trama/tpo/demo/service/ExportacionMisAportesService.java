package com.trama.tpo.demo.service;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.dto.MisAportesResponse;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.PdfService.Bloque;
import com.trama.tpo.demo.service.PdfService.Hito;
import com.trama.tpo.demo.service.PdfService.LineaDeTiempo;
import com.trama.tpo.demo.service.PdfService.Seccion;
import com.trama.tpo.demo.service.PdfService.Tabla;
import com.trama.tpo.demo.service.PdfService.Texto;
import com.trama.tpo.demo.service.PdfService.Tono;

/**
 * 8.4: cada miembro descarga lo que cargó en un niño (JSON o PDF), para conservarlo.
 * Solo sus propios aportes, también los archivados; nada de lo que cargaron otros.
 */
@Service
public class ExportacionMisAportesService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    private final PermisoService permisoService;
    private final AporteService aporteService;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final PdfService pdfService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public ExportacionMisAportesService(
            PermisoService permisoService,
            AporteService aporteService,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            PdfService pdfService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {

        this.permisoService = permisoService;
        this.aporteService = aporteService;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.pdfService = pdfService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
    }

    // Primero el permiso y después el formato: alguien ajeno recibe 403, no 400
    public String verificarPedido(UUID proyectoId, String formato) {

        permisoService.verificarMiembro(proyectoId);

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
    public MisAportesResponse exportar(UUID proyectoId) {

        List<AporteResponse> aportes = aporteService.listarMios(proyectoId);
        Proyecto proyecto = buscarProyecto(proyectoId);
        Usuario yo = buscarUsuario();

        registroAccionService.registrar(yo.getId(), proyectoId, AccionRegistro.VER, "MIS_APORTES");

        return new MisAportesResponse(Instant.now(), proyecto.getNombre(), nombre(yo), aportes);
    }

    @Transactional
    public byte[] exportarPdf(UUID proyectoId) {

        MisAportesResponse datos = exportar(proyectoId);
        Tono tono = membresiaRepository.findRol(usuarioActual.obtenerId(), proyectoId)
                .map(ExportacionPdfService::tono)
                .orElse(Tono.NEUTRO);

        List<Hito> hitos = datos.aportes().stream()
                .filter(a -> a.creadoEn() != null)
                .map(a -> hito(a, tono))
                .toList();

        long archivados = datos.aportes().stream().filter(a -> Boolean.TRUE.equals(a.archivado())).count();
        List<Bloque> bloques = hitos.isEmpty()
                ? List.of(new Texto("Todavía no cargaste aportes en este acompañamiento."))
                : List.of(
                        new Texto(datos.aportes().size() + (datos.aportes().size() == 1 ? " aporte" : " aportes")
                                + ", del más reciente al más antiguo"
                                + (archivados == 0 ? "." : " (" + archivados + (archivados == 1 ? " archivado)." : " archivados)."))),
                        new LineaDeTiempo(hitos));

        List<Seccion> secciones = List.of(
                new Seccion("Datos", List.of(new Tabla(List.of("Dato", "Valor"), List.of(
                        List.of("Quién los cargó", datos.autor()),
                        List.of("Acompañamiento", datos.nino()))))),
                new Seccion("Mis aportes", bloques));

        return pdfService.generar("Mis aportes · " + datos.nino(), secciones);
    }

    // Tipo y fecha en la etiqueta (el autor es siempre la misma persona)
    private static Hito hito(AporteResponse a, Tono tono) {
        String adjuntos = a.archivos() == null || a.archivos().isEmpty()
                ? ""
                : "\nAdjuntos: " + String.join(", ", a.archivos().stream().map(ArchivoResponse::nombreOriginal).toList());
        String etiqueta = ExportacionPdfService.legible(a.tipo().name()).toUpperCase(Locale.ROOT)
                + (Boolean.TRUE.equals(a.archivado()) ? " · ARCHIVADO" : "");
        String cuerpo = (a.contenido() == null || a.contenido().isBlank() ? "" : a.contenido()) + adjuntos;
        return new Hito(a.creadoEn().atZone(ZONA).toLocalDate(), tono, etiqueta, a.titulo(), cuerpo.strip());
    }

    private Proyecto buscarProyecto(UUID proyectoId) {
        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO", "No encontramos este proyecto", HttpStatus.NOT_FOUND));
    }

    private Usuario buscarUsuario() {
        return usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO", "No encontramos tu cuenta", HttpStatus.NOT_FOUND));
    }

    private static String nombre(Usuario usuario) {
        return (usuario.getNombre() + " " + usuario.getApellido()).trim();
    }
}
