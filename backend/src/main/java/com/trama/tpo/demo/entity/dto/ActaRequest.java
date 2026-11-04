package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActaRequest(
        @NotBlank(message = "El acta no puede estar vacía")
        @Size(max = 20000, message = "El acta no puede superar los 20000 caracteres")
        String acta
) {}

