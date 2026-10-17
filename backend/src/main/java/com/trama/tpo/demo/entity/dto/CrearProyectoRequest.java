package com.trama.tpo.demo.entity.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

public record CrearProyectoRequest(
        @NotBlank @Size(max = 80) String nombre,
        @NotBlank @Size(max = 80) String apellido,
        @Size(max = 40) String apodo,
        @NotNull @PastOrPresent LocalDate fechaNacimiento,
        @NotBlank @Size(max = 120) String escuela,
        @NotBlank @Size(max = 30) String grado,
        @NotNull @AssertTrue Boolean consentimiento) {

    public CrearProyectoRequest {
        nombre = nombre == null ? null : nombre.strip();
        apellido = apellido == null ? null : apellido.strip();
        apodo = apodo == null || apodo.isBlank() ? null : apodo.strip();
        escuela = escuela == null ? null : escuela.strip();
        grado = grado == null ? null : grado.strip();
    }
}
