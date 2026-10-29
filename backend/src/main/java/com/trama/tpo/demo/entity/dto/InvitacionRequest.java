package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.entity.membresia.Rol;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvitacionRequest {

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es valido")
    @Size(max = 254, message = "El email no puede superar los 254 caracteres")
    private String email;

    @NotNull(message = "El rol es obligatorio")
    private Rol rol;
}