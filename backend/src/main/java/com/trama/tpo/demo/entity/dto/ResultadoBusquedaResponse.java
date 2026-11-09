package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.aporte.TipoAporte;
import java.util.UUID;

public record ResultadoBusquedaResponse(UUID id, UUID proyectoId, TipoAporte tipo, String titulo, String fragmento) {}
