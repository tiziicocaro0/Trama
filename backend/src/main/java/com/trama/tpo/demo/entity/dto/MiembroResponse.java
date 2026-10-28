package com.trama.tpo.demo.entity.dto;

import java.time.Instant;
import java.util.List;
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
    /** 1.9: lista de especialidades declaradas (solo EDUCACION / SALUD). */
    private List<EspecialidadItemResponse> especialidades;
    private String matricula;
    private Instant fechaAlta;

    public static MiembroResponse from(Membresia membresia) {

        List<EspecialidadItemResponse> items = List.of();

        if (membresia.getEspecialidades() != null) {
            items = membresia.getEspecialidades().stream()
                    .map(me -> new EspecialidadItemResponse(
                            me.getEspecialidad().name(),
                            me.getAclaracion()))
                    .toList();
        }

        return MiembroResponse.builder()
                .id(membresia.getId())
                .usuarioId(membresia.getUsuario().getId())
                .nombre(membresia.getUsuario().getNombre())
                .apellido(membresia.getUsuario().getApellido())
                .rol(membresia.getRol())
                .esAdmin(membresia.getEsAdmin())
                .especialidades(items)
                .matricula(membresia.getMatricula())
                .fechaAlta(membresia.getFechaAlta())
                .build();
    }

    /**
     * Cada especialidad con su aclaración opcional.
     */
    public record EspecialidadItemResponse(
            String especialidad,
            String aclaracion
    ) {}
}
