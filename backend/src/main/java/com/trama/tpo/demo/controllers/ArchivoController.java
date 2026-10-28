package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.service.ArchivoService;
import com.trama.tpo.demo.service.ArchivoService.ArchivoDescargado;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/archivos")
public class ArchivoController {

    private final ArchivoService archivoService;

    public ArchivoController(ArchivoService archivoService) {
        this.archivoService = archivoService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ArchivoResponse> subir(
            @PathVariable UUID proyectoId,
            @RequestParam("archivo") MultipartFile archivo) {

        ArchivoResponse respuesta = archivoService.subir(proyectoId, archivo);
        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    @GetMapping("/{archivoId}")
    public ResponseEntity<byte[]> descargar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID archivoId) {

        ArchivoDescargado descargado = archivoService.descargar(proyectoId, archivoId);

        ContentDisposition disposicion = ContentDisposition.attachment()
                .filename(descargado.nombreOriginal(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(descargado.tipoMime()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicion.toString())
                .body(descargado.contenido());
    }
}

