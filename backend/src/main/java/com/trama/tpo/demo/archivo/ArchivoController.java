package com.trama.tpo.demo.archivo;

import com.trama.tpo.demo.archivo.dto.ArchivoResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/archivos")
@RequiredArgsConstructor
public class ArchivoController {

    private final ArchivoService archivoService;

    // SUBIR ARCHIVO
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ArchivoResponse subir(
            @PathVariable UUID proyectoId,
            @RequestParam("archivo") MultipartFile archivo) {

        return ArchivoResponse.from(
                archivoService.subir(proyectoId, archivo)
        );
    }

    // DESCARGAR ARCHIVO
    @GetMapping("/{archivoId}")
    public ResponseEntity<byte[]> descargar(
            @PathVariable UUID proyectoId,
            @PathVariable UUID archivoId) {

        ArchivoService.ArchivoDescarga descarga =
                archivoService.descargar(proyectoId, archivoId);

        String disposicion = ContentDisposition.attachment()
                .filename(descarga.nombreOriginal(), StandardCharsets.UTF_8)
                .build()
                .toString();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(descarga.tipoMime()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicion)
                .contentLength(descarga.contenido().length)
                .body(descarga.contenido());
    }
}
