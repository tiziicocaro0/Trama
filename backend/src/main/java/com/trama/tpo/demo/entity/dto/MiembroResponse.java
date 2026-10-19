
package com.trama.tpo.demo.entity.dto;

import java.util.UUID;

import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MiembroResponse {

    private UUID id;
    private UUID usuarioId;
    private String nombre;
    private String apellido;
    private Rol rol;
    private Boolean esAdmin;

    public static MiembroResponse from(Membresia membresia) {

        return MiembroResponse.builder()
                .id(membresia.getId())
                .usuarioId(membresia.getUsuario().getId())
                .nombre(membresia.getUsuario().getNombre())
                .apellido(membresia.getUsuario().getApellido())
                .rol(membresia.getRol())
                .esAdmin(membresia.getEsAdmin())
                .build();
    }
}
