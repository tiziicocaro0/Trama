package com.trama.tpo.demo.aporte;

import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.aporte.dto.*;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.UsuarioActual;

@Service
public class AporteService {
    private final AporteRepository aportes;
    private final AporteVersionRepository versiones;
    private final PermisoService permisos;
    private final UsuarioActual usuarioActual;

    public AporteService(AporteRepository aportes, AporteVersionRepository versiones,
            PermisoService permisos, UsuarioActual usuarioActual) {
        this.aportes = aportes;
        this.versiones = versiones;
        this.permisos = permisos;
        this.usuarioActual = usuarioActual;
    }

    @Transactional(readOnly = true)
    public AportesPerfilResponse listar(UUID proyectoId) {
        permisos.verificarMiembro(proyectoId);
        var visibilidades = permisos.visibilidadesPermitidas(proyectoId);
        boolean puedeCrear = permisos.puedeEditar(proyectoId);
        UUID usuarioId = usuarioActual.obtenerId();
        var lista = aportes.findVisibles(proyectoId, visibilidades).stream()
                .map(aporte -> AporteResponse.from(aporte, usuarioId, puedeCrear)).toList();
        return new AportesPerfilResponse(lista, puedeCrear);
    }

    @Transactional
    public AporteResponse crear(UUID proyectoId, AporteRequest request) {
        permisos.verificarPuedeEditar(proyectoId);
        UUID usuarioId = usuarioActual.obtenerId();
        Aporte aporte = new Aporte();
        aporte.setProyectoId(proyectoId);
        aporte.setAutorId(usuarioId);
        aporte.setTipo(request.tipo());
        aporte.setCreadoEn(Instant.now());
        aplicar(aporte, request);
        aporte.setActualizadoEn(aporte.getCreadoEn());
        return AporteResponse.from(aportes.save(aporte), usuarioId, true);
    }

    @Transactional
    public AporteResponse editar(UUID proyectoId, UUID aporteId, AporteRequest request) {
        permisos.verificarPuedeEditar(proyectoId);
        Aporte aporte = aportes.findByIdAndProyectoId(aporteId, proyectoId)
                .filter(actual -> !actual.isArchivado())
                .orElseThrow(() -> new ApiException("APORTE_NO_ENCONTRADO", "No encontramos este aporte", HttpStatus.NOT_FOUND));
        permisos.verificarAutor(aporte.getAutorId());
        if (aporte.getTipo() != request.tipo()) {
            throw new ApiException("SECCION_INVALIDA", "No se puede cambiar la sección de un aporte", HttpStatus.BAD_REQUEST);
        }
        AporteVersion version = new AporteVersion();
        version.setAporteId(aporte.getId());
        version.setAutorId(aporte.getAutorId());
        version.setTitulo(aporte.getTitulo());
        version.setContenido(aporte.getContenido());
        version.setDatos(aporte.getDatos());
        version.setCreadoEn(Instant.now());
        versiones.save(version);
        aplicar(aporte, request);
        return AporteResponse.from(aportes.save(aporte), usuarioActual.obtenerId(), true);
    }

    private void aplicar(Aporte aporte, AporteRequest request) {
        aporte.setTitulo(request.titulo());
        aporte.setContenido(request.contenido());
        aporte.setVisibilidad(request.visibilidad());
        aporte.setActualizadoEn(Instant.now());
    }
}
