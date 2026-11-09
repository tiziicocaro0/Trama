package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.service.ExportacionMisAportesService;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

// 8.4: cada miembro descarga lo que cargó en un niño (JSON o PDF)
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/mis-aportes")
public class MisAportesController {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    private final ExportacionMisAportesService exportacionMisAportesService;

    public MisAportesController(ExportacionMisAportesService exportacionMisAportesService) {
        this.exportacionMisAportesService = exportacionMisAportesService;
    }

    @GetMapping("/exportar")
    public ResponseEntity<?> exportar(
            @PathVariable UUID proyectoId,
            // Opcional acá para que el permiso se verifique antes (un ajeno recibe 403, no 400)
            @RequestParam(required = false) String formato) {

        String elegido = exportacionMisAportesService.verificarPedido(proyectoId, formato);

        // Sin el nombre del niño en el nombre del archivo
        String archivo = "trama-mis-aportes-" + LocalDate.now(ZONA) + "." + elegido;
        HttpHeaders encabezados = new HttpHeaders();
        encabezados.setContentDisposition(ContentDisposition.attachment().filename(archivo).build());

        if (elegido.equals("pdf")) {
            return ResponseEntity.ok()
                    .headers(encabezados)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(exportacionMisAportesService.exportarPdf(proyectoId));
        }

        return ResponseEntity.ok()
                .headers(encabezados)
                .contentType(MediaType.APPLICATION_JSON)
                .body(exportacionMisAportesService.exportar(proyectoId));
    }
}
