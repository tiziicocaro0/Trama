package com.trama.tpo.demo.service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.interes.DatosInteres;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ResumenProyectoResponse;

/**
 * 2.8 "Conocelo en 5 minutos": arma el resumen con lo que ya está cargado en el perfil.
 * Reutiliza AporteService.listar, que verifica que el usuario sea miembro, filtra por
 * visibilidad en la consulta a la base y deja afuera los aportes archivados.
 */
@Service
public class ResumenService {

    private final AporteService aporteService;
    // Solo lee el JSON "datos" de los intereses para ordenarlos por intensidad.
    private final ObjectMapper mapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    public ResumenService(AporteService aporteService) {
        this.aporteService = aporteService;
    }

    @Transactional(readOnly = true)
    public ResumenProyectoResponse obtener(UUID proyectoId) {

        List<AporteResponse> visibles = aporteService.listar(proyectoId, null, false);

        // Los de mayor intensidad primero; con la misma intensidad, el más reciente.
        List<AporteResponse> intereses = delTipo(visibles, TipoAporte.INTERES).stream()
                .sorted(Comparator.comparingInt(this::pesoIntensidad).reversed())
                .toList();

        return new ResumenProyectoResponse(
                intereses,
                delTipo(visibles, TipoAporte.FORTALEZA),
                delTipo(visibles, TipoAporte.COMUNICACION),
                delTipo(visibles, TipoAporte.SENSORIAL),
                delTipo(visibles, TipoAporte.ESTRATEGIA),
                delTipo(visibles, TipoAporte.DESREGULACION)
        );
    }

    private static List<AporteResponse> delTipo(List<AporteResponse> aportes, TipoAporte tipo) {
        return aportes.stream()
                .filter(aporte -> aporte.tipo() == tipo)
                .toList();
    }

    private int pesoIntensidad(AporteResponse interes) {
        if (interes.datos() == null || interes.datos().isBlank()) {
            return 0;
        }
        try {
            DatosInteres datos = mapper.readValue(interes.datos(), DatosInteres.class);
            return datos.intensidad() == null ? 0 : datos.intensidad().ordinal() + 1;
        } catch (JsonProcessingException datosIlegibles) {
            // Un interés con datos ilegibles se muestra igual, al final de la lista.
            return 0;
        }
    }
}
