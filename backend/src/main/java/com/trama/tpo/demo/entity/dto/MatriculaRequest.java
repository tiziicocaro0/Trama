package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.Size;

/** Matrícula que declara el profesional. Vacía o null la borra. */
public record MatriculaRequest(@Size(max = 40) String matricula) {

    public MatriculaRequest {
        matricula = matricula == null || matricula.isBlank() ? null : matricula.strip();
    }
}
