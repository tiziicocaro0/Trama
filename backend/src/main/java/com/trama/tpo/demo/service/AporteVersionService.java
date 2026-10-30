package com.trama.tpo.demo.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.AporteVersion;
import com.trama.tpo.demo.entity.dto.AporteVersionResponse;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;

/** Historial de versiones de un aporte (3.2). */
@Service
public class AporteVersionService {

    private final AporteRepository aporteRepository;
    private final AporteVersionRepository aporteVersionRepository;
    private final PermisoService permisoService;

    public AporteVersionService(
            AporteRepository aporteRepository,
            AporteVersionRepository aporteVersionRepository,
            PermisoService permisoService) {

        this.aporteRepository = aporteRepository;
        this.aporteVersionRepository = aporteVersionRepository;
        this.permisoService = permisoService;
    }

    // Todas las versiones del aporte, la actual incluida, de la más nueva a la más vieja.
    // Cada fila de aporte_version es una copia guardada al editar: su creado_en es
    // cuándo se reemplazó ese contenido, y la anterior marca cuándo se escribió.
    @Transactional(readOnly = true)
    public List<AporteVersionResponse> listarVersiones(UUID proyectoId, UUID aporteId) {

        permisoService.verificarMiembro(proyectoId);

        Aporte aporte = aporteRepository
                .findByIdAndProyectoId(aporteId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "APORTE_NO_ENCONTRADO",
                        "El aporte no existe",
                        HttpStatus.NOT_FOUND
                ));

        permisoService.verificarPuedeVerAporte(proyectoId, aporte.getVisibilidad());

        List<AporteVersion> anteriores =
                aporteVersionRepository.findByAporteIdOrderByCreadoEnAsc(aporteId);

        List<AporteVersionResponse> historial = new ArrayList<>();
        Instant escritaEn = aporte.getCreadoEn();

        for (int i = 0; i < anteriores.size(); i++) {

            AporteVersion version = anteriores.get(i);

            historial.add(new AporteVersionResponse(
                    i + 1,
                    false,
                    version.getTitulo(),
                    version.getContenido(),
                    version.getDatos(),
                    nombreCompleto(version.getAutor()),
                    escritaEn,
                    version.getCreadoEn()
            ));

            escritaEn = version.getCreadoEn();
        }

        // La versión actual es el aporte tal como está hoy
        historial.add(new AporteVersionResponse(
                anteriores.size() + 1,
                true,
                aporte.getTitulo(),
                aporte.getContenido(),
                aporte.getDatos(),
                nombreCompleto(aporte.getAutor()),
                escritaEn,
                null
        ));

        Collections.reverse(historial);

        return historial;
    }

    private String nombreCompleto(Usuario usuario) {
        return usuario.getNombre() + " " + usuario.getApellido();
    }
}
