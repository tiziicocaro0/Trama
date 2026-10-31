package com.trama.tpo.demo.entity.dto;

import java.util.List;

/** 9.2: lo que necesita la página /institucion en un solo pedido (institucion es null si no contrató). */
public record PaginaInstitucionResponse(InstitucionResponse institucion, List<PaqueteResponse> paquetes) {
}
