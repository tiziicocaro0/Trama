package com.trama.tpo.demo.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Respuesta generica para endpoints que solo devuelven un mensaje al usuario. */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MensajeResponse {

    private String mensaje;
}
