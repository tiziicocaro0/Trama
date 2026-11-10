package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.ResultadoBusquedaResponse;
import com.trama.tpo.demo.service.BusquedaAporteService;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}")
public class BusquedaAporteController {
    private final BusquedaAporteService busqueda;

    public BusquedaAporteController(BusquedaAporteService busqueda) { this.busqueda = busqueda; }

    @GetMapping("/buscar")
    public List<ResultadoBusquedaResponse> buscar(@PathVariable UUID proyectoId, @RequestParam(required = false) String q) {
        return busqueda.buscar(proyectoId, q);
    }
}
