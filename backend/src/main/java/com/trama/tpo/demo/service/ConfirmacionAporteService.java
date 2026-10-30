package com.trama.tpo.demo.service;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.ConfirmacionAporte;
import com.trama.tpo.demo.aporte.ConfirmacionAporteId;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.ConfirmacionAporteRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * "Yo también lo observé" / "A mí también me funcionó" (3.3).
 * Confirmar refuerza un aporte ajeno sin modificarlo: el aporte no se guarda ni se versiona.
 */
@Service
public class ConfirmacionAporteService {

    private final AporteRepository aporteRepository;
    private final ConfirmacionAporteRepository confirmacionAporteRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;
    private final UsuarioRepository usuarioRepository;

    /** Quién confirmó un aporte, para armar la respuesta del listado. */
    public record Confirmante(UUID usuarioId, String nombre) {}

    public ConfirmacionAporteService(
            AporteRepository aporteRepository,
            ConfirmacionAporteRepository confirmacionAporteRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService,
            UsuarioRepository usuarioRepository) {

        this.aporteRepository = aporteRepository;
        this.confirmacionAporteRepository = confirmacionAporteRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
        this.usuarioRepository = usuarioRepository;
    }

    // Para el listado: quiénes confirmaron cada aporte, del primero al último.
    // Dos consultas en total (confirmaciones y nombres), sin importar cuántos aportes haya.
    // No verifica permisos: lo llama AporteService con aportes que el usuario ya puede ver.
    public Map<UUID, List<Confirmante>> confirmantesPorAporte(Collection<UUID> aporteIds) {

        if (aporteIds.isEmpty()) {
            return Map.of();
        }

        List<ConfirmacionAporte> confirmaciones =
                confirmacionAporteRepository.findByIdAporteIdIn(aporteIds);

        Map<UUID, String> nombres = usuarioRepository
                .findAllById(confirmaciones.stream().map(c -> c.getId().getUsuarioId()).distinct().toList())
                .stream()
                .collect(Collectors.toMap(Usuario::getId, u -> (u.getNombre() + " " + u.getApellido()).trim()));

        return confirmaciones.stream()
                .sorted(Comparator.comparing(ConfirmacionAporte::getFecha))
                .collect(Collectors.groupingBy(
                        c -> c.getId().getAporteId(),
                        Collectors.mapping(
                                c -> new Confirmante(c.getId().getUsuarioId(), nombres.get(c.getId().getUsuarioId())),
                                Collectors.toList())));
    }

    // Puede confirmar quien puede ver el aporte, salvo su autor. Confirmar dos veces no duplica.
    @Transactional
    public void confirmar(UUID proyectoId, UUID aporteId) {

        Aporte aporte = obtenerVisible(proyectoId, aporteId);
        UUID usuarioId = usuarioActual.obtenerId();

        if (aporte.getAutor().getId().equals(usuarioId)) {
            throw new ApiException(
                    "APORTE_PROPIO",
                    "No podés confirmar tu propio aporte",
                    HttpStatus.BAD_REQUEST);
        }

        if (Boolean.TRUE.equals(aporte.getArchivado())) {
            throw new ApiException(
                    "APORTE_ARCHIVADO",
                    "No se puede confirmar un aporte archivado",
                    HttpStatus.CONFLICT);
        }

        ConfirmacionAporteId id = new ConfirmacionAporteId(aporteId, usuarioId);
        if (confirmacionAporteRepository.existsById(id)) {
            return;
        }

        confirmacionAporteRepository.save(new ConfirmacionAporte(id, null));

        // 0.2: auditoría
        registroAccionService.registrar(
                usuarioId, proyectoId, AccionRegistro.CONFIRMAR, aporte.getTipo().name());
    }

    // Cada uno quita solo su propia confirmación, aunque el aporte ya esté archivado
    @Transactional
    public void quitar(UUID proyectoId, UUID aporteId) {

        Aporte aporte = obtenerVisible(proyectoId, aporteId);
        UUID usuarioId = usuarioActual.obtenerId();

        ConfirmacionAporteId id = new ConfirmacionAporteId(aporteId, usuarioId);
        if (!confirmacionAporteRepository.existsById(id)) {
            return;
        }

        confirmacionAporteRepository.deleteById(id);

        // 0.2: auditoría
        registroAccionService.registrar(
                usuarioId, proyectoId, AccionRegistro.QUITAR_CONFIRMACION, aporte.getTipo().name());
    }

    private Aporte obtenerVisible(UUID proyectoId, UUID aporteId) {

        permisoService.verificarMiembro(proyectoId);

        Aporte aporte = aporteRepository
                .findByIdAndProyectoId(aporteId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "APORTE_NO_ENCONTRADO",
                        "El aporte no existe",
                        HttpStatus.NOT_FOUND));

        permisoService.verificarPuedeVerAporte(proyectoId, aporte.getVisibilidad());

        return aporte;
    }
}
