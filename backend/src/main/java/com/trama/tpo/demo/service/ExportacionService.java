package com.trama.tpo.demo.service;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Stream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.entity.dto.AcuerdoResponse;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.EventoResponse;
import com.trama.tpo.demo.entity.dto.ExportacionResponse;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ProyectoRepository;

/**
 * Descargar toda la información del niño (8.1), para ejercer el derecho de acceso.
 * Arma los datos y el JSON; el PDF lo arma ExportacionPdfService con estos mismos datos.
 * Solo los tutores. Queda en la auditoría como VER / EXPORTACION.
 */
@Service
public class ExportacionService {

    private final PermisoService permisoService;
    private final ProyectoRepository proyectoRepository;
    private final MiembroService miembroService;
    private final AporteService aporteService;
    private final EventoService eventoService;
    private final AcuerdoService acuerdoService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public ExportacionService(
            PermisoService permisoService,
            ProyectoRepository proyectoRepository,
            MiembroService miembroService,
            AporteService aporteService,
            EventoService eventoService,
            AcuerdoService acuerdoService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {

        this.permisoService = permisoService;
        this.proyectoRepository = proyectoRepository;
        this.miembroService = miembroService;
        this.aporteService = aporteService;
        this.eventoService = eventoService;
        this.acuerdoService = acuerdoService;
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
}
