package com.trama.tpo.demo.controllers;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.trama.tpo.demo.entity.dto.FotoResponse;
import com.trama.tpo.demo.service.FotoService;

/** Foto del niño. Solo el tutor administrador la cambia; la ve toda la red por /archivos. */
@RestController
@RequestMapping("/api/proyectos/{proyectoId}/foto")
public class FotoProyectoController {

    private final FotoService fotoService;

    public FotoProyectoController(FotoService fotoService) {
        this.fotoService = fotoService;
    }

    // POST: sube la foto ya recortada y reemplaza la anterior.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FotoResponse subir(
            @PathVariable UUID proyectoId,
            @RequestParam("archivo") MultipartFile archivo) {
        return fotoService.subirFotoProyecto(proyectoId, archivo);
    }

    @DeleteMapping
    public ResponseEntity<Void> quitar(@PathVariable UUID proyectoId) {
        fotoService.quitarFotoProyecto(proyectoId);
        return ResponseEntity.noContent().build();
    }
}
