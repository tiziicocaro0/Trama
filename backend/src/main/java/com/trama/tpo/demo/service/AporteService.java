package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AporteService {

    private final AporteRepository aporteRepository;
    private final PermisoService permisoService;

    public AporteService(
            AporteRepository aporteRepository,
            PermisoService permisoService) {

        this.aporteRepository = aporteRepository;
        this.permisoService = permisoService;
    }

    public Aporte obtenerParaEditar(UUID proyectoId, UUID aporteId) {

        // Verificar que el usuario pertenece al proyecto
        permisoService.verificarMiembro(proyectoId);

        // Verificar que tiene permisos de edición
        permisoService.verificarPuedeEditar(proyectoId);

        // Buscar el aporte dentro del proyecto
        Aporte aporte = aporteRepository
                .findByIdAndProyectoId(aporteId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "APORTE_NO_ENCONTRADO",
                        "El aporte no existe",
                        HttpStatus.NOT_FOUND
                ));

        // Solo el autor puede modificar el aporte
        permisoService.verificarAutor(aporte.getAutor().getId());

        return aporte;
    }

    @Transactional
    public void archivar(UUID proyectoId, UUID aporteId) {

        // Verificar permisos y autoría
        Aporte aporte = obtenerParaEditar(proyectoId, aporteId);

        // Archivar sin eliminar el registro
        aporte.setArchivado(true);

        // Guardar el cambio
        aporteRepository.save(aporte);
    }
}