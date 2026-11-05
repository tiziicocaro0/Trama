package com.trama.tpo.demo.controllers;

import java.util.UUID;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.dto.MatriculaRequest;
import com.trama.tpo.demo.service.CuentaService;
import com.trama.tpo.demo.service.FotoService;

import jakarta.validation.Valid;

/** La propia cuenta (Mi perfil). Requiere sesión: /api/usuarios/** en SecurityConfig. */
@RestController
@RequestMapping("/api/usuarios")
public class CuentaController {

    private final CuentaService cuentaService;
    private final FotoService fotoService;

    public CuentaController(CuentaService cuentaService, FotoService fotoService) {
        this.cuentaService = cuentaService;
        this.fotoService = fotoService;
    }

    // PUT: guarda o borra la matrícula declarada y devuelve los datos de la cuenta.
    @PutMapping("/yo/matricula")
    public AuthenticationResponse actualizarMatricula(@Valid @RequestBody MatriculaRequest request) {
        return cuentaService.actualizarMatricula(request);
    }

    // POST: comprobante opcional de la matrícula (PDF, JPG o PNG). Requiere el número.
    @PostMapping(value = "/yo/matricula/comprobante", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AuthenticationResponse subirComprobante(@RequestParam("archivo") MultipartFile archivo) {
        return cuentaService.subirComprobante(archivo);
    }

    @DeleteMapping("/yo/matricula/comprobante")
    public AuthenticationResponse quitarComprobante() {
        return cuentaService.quitarComprobante();
    }

    // GET: el comprobante de un profesional, para la persona y para su red.
    @GetMapping("/{usuarioId}/matricula/comprobante")
    public ResponseEntity<byte[]> comprobante(@PathVariable UUID usuarioId) {
        var comprobante = cuentaService.descargarComprobante(usuarioId);
        String extension = switch (comprobante.tipoMime()) {
            case "application/pdf" -> "pdf";
            case "image/png" -> "png";
            default -> "jpg";
        };
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(comprobante.tipoMime()))
                .header("Content-Disposition", "inline; filename=\"comprobante-matricula." + extension + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noStore())
                .body(comprobante.contenido());
    }

    // POST: sube la foto de la cuenta, ya recortada, y reemplaza la anterior.
    @PostMapping(value = "/yo/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> subirFoto(@RequestParam("archivo") MultipartFile archivo) {
        fotoService.subirFotoUsuario(archivo);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/yo/foto")
    public ResponseEntity<Void> quitarFoto() {
        fotoService.quitarFotoUsuario();
        return ResponseEntity.noContent().build();
    }

    // GET: la foto de una persona. Solo para ella y para quien comparte algún niño con ella.
    @GetMapping("/{usuarioId}/foto")
    public ResponseEntity<byte[]> foto(@PathVariable UUID usuarioId) {
        var foto = fotoService.descargarFotoUsuario(usuarioId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(foto.tipoMime()))
                .cacheControl(CacheControl.noStore())
                .body(foto.contenido());
    }
}
