
package com.trama.tpo.demo.entity.dto;

import java.time.Instant;

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

    private String nombreProyecto;
    private String nombreInvitador;
    private Rol rol;
    private Instant venceEn;

    public static InvitacionDetalleResponse from(Invitacion invitacion) {

        return InvitacionDetalleResponse.builder()
                .nombreProyecto(invitacion.getProyecto().getNombre())
                .nombreInvitador(invitacion.getInvitadoPor().getNombre())
                .rol(invitacion.getRol())
                .venceEn(invitacion.getVenceEn())
                .build();
    }
}
