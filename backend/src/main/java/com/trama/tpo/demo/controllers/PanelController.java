package com.trama.tpo.demo.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trama.tpo.demo.entity.dto.PanelItemResponse;
import com.trama.tpo.demo.service.PanelService;

/**
 * 7.1: Panel de profesionales.
 * GET /api/panel: devuelve el resumen semanal de los niños asignados y estado freemium.
 */
@RestController
@RequestMapping("/api/panel")
public class PanelController {

    private final PanelService panelService;

    public PanelController(PanelService panelService) {
        this.panelService = panelService;
    }

    @GetMapping
    public List<PanelItemResponse> obtenerResumenPanel() {
        return panelService.obtenerResumenPanel();
    }
}

