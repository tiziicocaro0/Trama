package com.trama.tpo.demo.entity.dto;

import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {

    @JsonProperty("access_token")
    private String accessToken;

    private UUID id;

    private String nombre;

    private String apellido;

    private String email;

    /** 9.4: solo en GET /auth/yo. */
    private TipoCuenta tipoCuenta;

    /** 9.4: especialidades de la cuenta, para precargar las de cada niño. */
    private List<Especialidad> especialidades;
}