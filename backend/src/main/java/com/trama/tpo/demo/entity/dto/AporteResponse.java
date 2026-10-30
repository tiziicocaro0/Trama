package com.trama.tpo.demo.entity.dto;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AporteResponse(
        UUID id,
        UUID proyectoId,
        UUID autorId,
        // Nombre y apellido del autor: el aporte lo muestra aunque ya no sea miembro (1.5, 2.2)
        String autorNombre,
        TipoAporte tipo,
        String titulo,
        String contenido,
        String datos,
        Visibilidad visibilidad,
        Boolean archivado,
        Instant creadoEn,
        Instant actualizadoEn,
        // true si el usuario actual es el autor y puede cargar en el proyecto
        Boolean puedeEditar,
        List<UUID> archivoIds,
        List<ArchivoResponse> archivos,
        // 4.2: especialidades declaradas por el autor en este proyecto (vacía si no tiene)
        List<MiembroResponse.EspecialidadItemResponse> autorEspecialidades,
        // 3.3: cuántos confirmaron, si el usuario actual ya confirmó y los nombres (para el hover)
        Integer confirmaciones,
        Boolean yoConfirme,
        List<String> confirmadoPor
) {

    public AporteResponse(
            UUID id,
            UUID proyectoId,
            UUID autorId,
            TipoAporte tipo,
            String titulo,
            String contenido,
            String datos,
            Visibilidad visibilidad,
            Boolean archivado,
            Instant creadoEn,
            Instant actualizadoEn,
            Boolean puedeEditar) {
        this(
                id,
                proyectoId,
                autorId,
                null,
                tipo,
                titulo,
                contenido,
                datos,
                visibilidad,
                archivado,
                creadoEn,
                actualizadoEn,
                puedeEditar,
                List.of(),
                List.of(),
                List.of(),
                0,
                false,
                List.of()
        );
    }
}
