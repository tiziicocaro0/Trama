package com.trama.tpo.demo.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.ConfiguracionProyectoRequest;
import com.trama.tpo.demo.entity.dto.ProyectoResponse;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ProyectoRepository;

@Service
public class ProyectoService {

    private final ProyectoRepository proyectoRepository;
    private final PermisoService permisoService;

    public ProyectoService(
            ProyectoRepository proyectoRepository,
            PermisoService permisoService) {

        this.proyectoRepository = proyectoRepository;
        this.permisoService = permisoService;
    }

    // Ver los datos de un niño: solo sus miembros
    @Transactional(readOnly = true)
    public ProyectoResponse obtener(UUID proyectoId) {

        permisoService.verificarMiembro(proyectoId);

        return ProyectoResponse.from(buscarProyecto(proyectoId));
    }

    // Cambiar qué puede hacer la familia: solo el tutor administrador
    @Transactional
    public ProyectoResponse actualizarConfiguracion(
            UUID proyectoId,
            ConfiguracionProyectoRequest request) {

        permisoService.verificarAdmin(proyectoId);

        Proyecto proyecto = buscarProyecto(proyectoId);

        proyecto.setFamiliarPuedeCargar(request.familiarPuedeCargar());
        proyecto.setFamiliarVeNotas(request.familiarVeNotas());

        return ProyectoResponse.from(proyectoRepository.save(proyecto));
    }

    private Proyecto buscarProyecto(UUID proyectoId) {

        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO",
                        "No encontramos este proyecto",
                        HttpStatus.NOT_FOUND
                ));
    }
}
