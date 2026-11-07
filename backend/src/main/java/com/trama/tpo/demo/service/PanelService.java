package com.trama.tpo.demo.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.PanelItemResponse;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.EventoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * 7.1: Servicio del panel para profesionales: lista todos los niños con novedades de los últimos 7 días
 * y el estado de solo lectura por el límite gratuito.
 */
@Service
public class PanelService {

    private final MembresiaRepository membresiaRepository;
    private final AporteRepository aporteRepository;
    private final EventoRepository eventoRepository;
    private final PermisoService permisoService;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioActual usuarioActual;

    public PanelService(
            MembresiaRepository membresiaRepository,
            AporteRepository aporteRepository,
            EventoRepository eventoRepository,
            PermisoService permisoService,
            UsuarioRepository usuarioRepository,
            UsuarioActual usuarioActual) {
        this.membresiaRepository = membresiaRepository;
        this.aporteRepository = aporteRepository;
        this.eventoRepository = eventoRepository;
        this.permisoService = permisoService;
        this.usuarioRepository = usuarioRepository;
        this.usuarioActual = usuarioActual;
    }

    @Transactional(readOnly = true)
    public List<PanelItemResponse> obtenerResumenPanel() {
        UUID usuarioId = usuarioActual.obtenerId();

        boolean esProfesionalEnRed = membresiaRepository.existsByUsuarioIdAndRolIn(
                usuarioId,
                PlanService.ROLES_PROFESIONALES
        );

        boolean esCuentaProfesional = usuarioRepository.findById(usuarioId)
                .map(u -> u.getTipoCuenta() == TipoCuenta.PROFESIONAL)
                .orElse(false);

        if (!esProfesionalEnRed && !esCuentaProfesional) {
            throw new AccessDeniedException("El panel de novedades es exclusivo para profesionales");
        }

        Instant hace7Dias = Instant.now().minus(7, ChronoUnit.DAYS);

        List<Membresia> membresias = membresiaRepository.findByUsuarioIdConProyecto(usuarioId);

        return membresias.stream().map(membresia -> {
            Proyecto proyecto = membresia.getProyecto();
            Rol rol = membresia.getRol();

            List<Visibilidad> visibilidades = PermisoService.visibilidadesPermitidas(rol);
            TipoAporte tipoOculto = (rol == Rol.FAMILIAR && !Boolean.TRUE.equals(proyecto.getFamiliarVeNotas()))
                    ? TipoAporte.NOTA_PROFESIONAL
                    : null;

            long aportesNuevos = aporteRepository.contarAportesNuevosVisibles(
                    proyecto.getId(),
                    visibilidades,
                    tipoOculto,
                    hace7Dias
            );

            long eventosNuevos = eventoRepository.contarEventosNuevos(
                    proyecto.getId(),
                    hace7Dias
            );

            long totalNovedades = aportesNuevos + eventosNuevos;

            boolean soloLectura = permisoService.soloLecturaPorPlan(proyecto.getId());

            return new PanelItemResponse(
                    proyecto.getId(),
                    proyecto.getNombre(),
                    proyecto.getApellido(),
                    proyecto.getApodo(),
                    proyecto.getFechaNacimiento(),
                    proyecto.getFotoArchivoId(),
                    rol,
                    aportesNuevos,
                    eventosNuevos,
                    totalNovedades,
                    soloLectura
            );
        }).toList();
    }
}
