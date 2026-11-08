package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotBlank;

public record ComentarioRequest(
        @NotBlank(message = "El comentario no puede estar vacío")
        String texto
) {}
