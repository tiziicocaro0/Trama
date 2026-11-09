package com.trama.tpo.demo.controllers;

import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.dto.RecursoResponse;
import com.trama.tpo.demo.service.ArchivoService;
import com.trama.tpo.demo.service.ArchivoService.ArchivoDescargado;
import com.trama.tpo.demo.service.RecursoService;

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
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/archivos")
public class ArchivoController {

    private final ArchivoService archivoService;
    private final RecursoService recursoService;

    public ArchivoController(ArchivoService archivoService, RecursoService recursoService) {
        this.archivoService = archivoService;
        this.recursoService = recursoService;
    }

    // Con visibilidad: es un recurso del niño (pestaña Recursos). Sin ella: un adjunto.
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ArchivoResponse> subir(
            @PathVariable UUID proyectoId,
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam(value = "visibilidad", required = false) Visibilidad visibilidad) {

        ArchivoResponse respuesta = archivoService.subir(proyectoId, archivo, visibilidad);
        return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
    }

    // Galería de Recursos: lo subido directo y los adjuntos de los aportes que la persona puede ver
    @GetMapping
    public ResponseEntity<List<RecursoResponse>> listar(@PathVariable UUID proyectoId) {
        return ResponseEntity.ok(recursoService.listar(proyectoId));
    }

    @PostMapping("/{archivoId}/archivar")
    public ResponseEntity<Void> archivar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID archivoId) {

        recursoService.archivar(proyectoId, archivoId);
        return ResponseEntity.noContent().build();
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

