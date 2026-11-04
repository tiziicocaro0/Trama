package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.service.ExportacionService;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

// 8.1: descargar toda la información del niño (solo tutores)
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/exportar")
public class ExportacionController {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    private final ExportacionService exportacionService;

    public ExportacionController(ExportacionService exportacionService) {
        this.exportacionService = exportacionService;
    }

    @GetMapping
    public ResponseEntity<?> exportar(
            @PathVariable UUID proyectoId,
            // Opcional acá para que el permiso se verifique antes (un no tutor recibe 403, no 400)
            @RequestParam(required = false) String formato) {

        String elegido = exportacionService.verificarPedido(proyectoId, formato);

        // Sin el nombre del niño en el nombre del archivo
        String archivo = "trama-datos-" + LocalDate.now(ZONA) + "." + elegido;
        HttpHeaders encabezados = new HttpHeaders();
        encabezados.setContentDisposition(ContentDisposition.attachment().filename(archivo).build());

        if (elegido.equals("pdf")) {
            return ResponseEntity.ok()
                    .headers(encabezados)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(exportacionService.exportarPdf(proyectoId));
        }

        return ResponseEntity.ok()
                .headers(encabezados)
                .contentType(MediaType.APPLICATION_JSON)
                .body(exportacionService.exportar(proyectoId));
    }
}
