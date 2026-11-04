package com.trama.tpo.demo.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.entity.dto.AcuerdoRequest;
import com.trama.tpo.demo.entity.dto.AcuerdoResponse;
import com.trama.tpo.demo.entity.evento.Acuerdo;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AcuerdoRepository;
import com.trama.tpo.demo.repository.EventoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * Acuerdos de una reunión, con responsable y fecha de revisión (5.6).
 * El aviso cuando vencen sin cumplirse lo manda AvisoAcuerdoService.
 */
@Service
public class AcuerdoService {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");
    private static final String SECCION = "ACUERDO";

    private final AcuerdoRepository acuerdoRepository;
    private final EventoRepository eventoRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public AcuerdoService(
            AcuerdoRepository acuerdoRepository,
            EventoRepository eventoRepository,
            MembresiaRepository membresiaRepository,
            UsuarioRepository usuarioRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {

        this.acuerdoRepository = acuerdoRepository;
        this.eventoRepository = eventoRepository;
        this.membresiaRepository = membresiaRepository;
        this.usuarioRepository = usuarioRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
    }

    // Crear: quien puede cargar en el proyecto
    @Transactional
    public AcuerdoResponse crear(UUID proyectoId, AcuerdoRequest request) {

        permisoService.verificarMiembro(proyectoId);
        permisoService.verificarPuedeEditar(proyectoId);

        Acuerdo acuerdo = Acuerdo.builder()
                .reunion(buscarReunion(proyectoId, request.reunionId()))
                .responsable(buscarResponsable(proyectoId, request.responsableId()))
                .descripcion(request.descripcion().trim())
                .fechaRevision(request.fechaRevision())
                .build();

        Acuerdo guardado = acuerdoRepository.save(acuerdo);

        // 0.2: auditoría (nunca el texto del acuerdo)
        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.CREAR, SECCION);

        return convertir(guardado, true, esTutor(proyectoId));
    }

    // Los acuerdos de una reunión, para cualquier miembro
    @Transactional(readOnly = true)
    public List<AcuerdoResponse> listar(UUID proyectoId, UUID reunionId) {

        permisoService.verificarMiembro(proyectoId);

        if (reunionId == null) {
            throw new ApiException(
                    "REUNION_REQUERIDA",
                    "Indicá de qué reunión querés ver los acuerdos",
                    HttpStatus.BAD_REQUEST);
        }

        buscarReunion(proyectoId, reunionId);

        // Se calculan una sola vez para toda la lista
        boolean puedeEditar = permisoService.puedeEditar(proyectoId);
        boolean esTutor = esTutor(proyectoId);

        return acuerdoRepository.findByReunionIdOrderByFechaRevisionAsc(reunionId).stream()
                .map(acuerdo -> convertir(acuerdo, puedeEditar, esTutor))
                .toList();
    }

    // Editar descripción, responsable, fecha o reunión: quien puede cargar
    @Transactional
    public AcuerdoResponse editar(UUID proyectoId, UUID acuerdoId, AcuerdoRequest request) {

        permisoService.verificarMiembro(proyectoId);
        permisoService.verificarPuedeEditar(proyectoId);

        Acuerdo acuerdo = buscarAcuerdo(proyectoId, acuerdoId);

        // Con otra fecha, el aviso de vencimiento vuelve a correr
        if (!Objects.equals(acuerdo.getFechaRevision(), request.fechaRevision())) {
            acuerdo.setAvisadoEn(null);
        }

        acuerdo.setReunion(buscarReunion(proyectoId, request.reunionId()));
        acuerdo.setResponsable(buscarResponsable(proyectoId, request.responsableId()));
        acuerdo.setDescripcion(request.descripcion().trim());
        acuerdo.setFechaRevision(request.fechaRevision());

        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.EDITAR, SECCION);

        return convertir(acuerdoRepository.save(acuerdo), true, esTutor(proyectoId));
    }

    // Marcar o desmarcar cumplido: el responsable o un tutor (aunque el responsable no pueda cargar)
    @Transactional
    public AcuerdoResponse marcarCumplido(UUID proyectoId, UUID acuerdoId, boolean cumplido) {

        permisoService.verificarMiembro(proyectoId);

        Acuerdo acuerdo = buscarAcuerdo(proyectoId, acuerdoId);
        boolean esTutor = esTutor(proyectoId);

        if (!puedeMarcarCumplido(acuerdo, esTutor)) {
            throw new AccessDeniedException(
                    "Solo el responsable o un tutor pueden marcar este acuerdo");
        }

        acuerdo.setCumplido(cumplido);

        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.EDITAR, SECCION);

        return convertir(acuerdoRepository.save(acuerdo), permisoService.puedeEditar(proyectoId), esTutor);
    }

    private Evento buscarReunion(UUID proyectoId, UUID reunionId) {

        Evento reunion = eventoRepository.findByIdAndProyectoId(reunionId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "REUNION_NO_ENCONTRADA",
                        "La reunión no existe",
                        HttpStatus.NOT_FOUND));

        if (!"REUNION".equals(reunion.getTipo())) {
            throw new ApiException(
                    "NO_ES_REUNION",
                    "Los acuerdos solo se cargan en reuniones",
                    HttpStatus.BAD_REQUEST);
        }

        return reunion;
    }

    private Usuario buscarResponsable(UUID proyectoId, UUID responsableId) {

        if (!membresiaRepository.existsByUsuarioIdAndProyectoId(responsableId, proyectoId)) {
            throw new ApiException(
                    "RESPONSABLE_NO_ES_MIEMBRO",
                    "La persona responsable tiene que ser parte del equipo",
                    HttpStatus.BAD_REQUEST);
        }

        return usuarioRepository.getReferenceById(responsableId);
    }

    private Acuerdo buscarAcuerdo(UUID proyectoId, UUID acuerdoId) {

        return acuerdoRepository.findByIdAndReunionProyectoId(acuerdoId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "ACUERDO_NO_ENCONTRADO",
                        "El acuerdo no existe",
                        HttpStatus.NOT_FOUND));
    }

    private boolean esTutor(UUID proyectoId) {

        return membresiaRepository.findRol(usuarioActual.obtenerId(), proyectoId)
                .filter(rol -> rol == Rol.TUTOR)
                .isPresent();
    }

    private boolean puedeMarcarCumplido(Acuerdo acuerdo, boolean esTutor) {

        return esTutor || acuerdo.getResponsable().getId().equals(usuarioActual.obtenerId());
    }

    private AcuerdoResponse convertir(Acuerdo acuerdo, boolean puedeEditar, boolean esTutor) {

        Usuario responsable = acuerdo.getResponsable();
        boolean cumplido = Boolean.TRUE.equals(acuerdo.getCumplido());

        return new AcuerdoResponse(
                acuerdo.getId(),
                acuerdo.getReunion().getId(),
                acuerdo.getDescripcion(),
                responsable.getId(),
                (responsable.getNombre() + " " + responsable.getApellido()).trim(),
                acuerdo.getFechaRevision(),
                cumplido,
                !cumplido && acuerdo.getFechaRevision().isBefore(LocalDate.now(ZONA)),
                puedeEditar,
                puedeMarcarCumplido(acuerdo, esTutor));
    }
}
