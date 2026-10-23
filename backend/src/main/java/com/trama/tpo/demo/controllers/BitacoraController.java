package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.aporte.observacion.ContextoObservacion;
import com.trama.tpo.demo.aporte.observacion.EtiquetaObservacion;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.service.BitacoraService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/bitacora")
public class BitacoraController {

    private final BitacoraService bitacoraService;

    public BitacoraController(BitacoraService bitacoraService) {
        this.bitacoraService = bitacoraService;
    }

    // LISTAR OBSERVACIONES CON FILTROS
    @GetMapping
    public ResponseEntity<List<AporteResponse>> listar(
            @PathVariable UUID proyectoId,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate desde,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate hasta,

            @RequestParam(required = false)
            ContextoObservacion contexto,

            @RequestParam(required = false)
            EtiquetaObservacion etiqueta,

            @RequestParam(required = false)
            UUID autorId,

            @RequestParam(defaultValue = "0")
            int pagina) {

        return ResponseEntity.ok(
                bitacoraService.listar(
                        proyectoId,
                        desde,
                        hasta,
                        contexto,
                        etiqueta,
                        autorId,
                        pagina
                )
        );
    }
}