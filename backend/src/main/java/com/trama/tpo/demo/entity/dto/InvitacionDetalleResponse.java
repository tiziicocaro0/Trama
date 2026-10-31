
package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.util.UUID;

import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.membresia.Rol;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InvitacionDetalleResponse {

    /** 9.4: para llevar al niño después de aceptar (sin ser miembro no da acceso a nada). */
    private UUID proyectoId;
    private String nombreProyecto;
    private String nombreInvitador;
    private Rol rol;
    private Instant venceEn;

    public static InvitacionDetalleResponse from(Invitacion invitacion) {

        return InvitacionDetalleResponse.builder()
                .proyectoId(invitacion.getProyecto().getId())
                .nombreProyecto(invitacion.getProyecto().getNombre())
                .nombreInvitador(invitacion.getInvitadoPor().getNombre())
                .rol(invitacion.getRol())
                .venceEn(invitacion.getVenceEn())
                .build();
    }
}
