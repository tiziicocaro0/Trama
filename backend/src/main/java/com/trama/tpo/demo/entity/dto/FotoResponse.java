package com.trama.tpo.demo.entity.dto;

import java.util.UUID;

/** Foto del niño recién subida: se descarga por /archivos/{fotoArchivoId}. */
public record FotoResponse(UUID fotoArchivoId) {}
