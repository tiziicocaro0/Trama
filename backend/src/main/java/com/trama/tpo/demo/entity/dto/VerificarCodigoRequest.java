package com.trama.tpo.demo.entity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VerificarCodigoRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es valido")
    @Size(max = 254, message = "El email no puede superar los 254 caracteres")
    private String email;

    @NotBlank(message = "El codigo es obligatorio")
    @Pattern(regexp = "\\d{6}", message = "El codigo debe tener 6 digitos")
    private String codigo;
}
