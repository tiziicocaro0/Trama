package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 9.2: el responsable asocia a un profesional por su email de Trama. */
public record AsociarProfesionalRequest(
        @NotBlank(message = "Ingresá un email")
        @Email(message = "Ingresá un email válido")
        @Size(max = 254, message = "El email puede tener hasta 254 caracteres")
        String email) {
}
