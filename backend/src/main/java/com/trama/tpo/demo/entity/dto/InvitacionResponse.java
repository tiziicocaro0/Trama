package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.util.UUID;

import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.membresia.Rol;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvitacionResponse {

    private UUID id;
    private String email;
    private Rol rol;
    private EstadoInvitacion estado;
    private Instant venceEn;

    public static InvitacionResponse from(Invitacion invitacion) {

        return InvitacionResponse.builder()
                .id(invitacion.getId())
                .email(invitacion.getEmail())
                .rol(invitacion.getRol())
                .estado(invitacion.getEstado())
                .venceEn(invitacion.getVenceEn())
                .build();
    }
}