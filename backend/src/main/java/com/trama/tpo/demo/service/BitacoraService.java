package com.trama.tpo.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.abc.DatosAbc;
import com.trama.tpo.demo.aporte.observacion.ContextoObservacion;
import com.trama.tpo.demo.aporte.observacion.DatosObservacion;
import com.trama.tpo.demo.aporte.observacion.EtiquetaObservacion;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.exceptions.ApiException;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BitacoraService {

    public static final int TAMANIO_PAGINA = 20;

    private final AporteService aporteService;
    private final ObjectMapper mapper;

    public BitacoraService(AporteService aporteService) {
        this.aporteService = aporteService;
        this.mapper = new ObjectMapper();
        this.mapper.findAndRegisterModules();
    }

    public List<AporteResponse> listar(
            UUID proyectoId,
            LocalDate desde,
            LocalDate hasta,
            ContextoObservacion contexto,
            EtiquetaObservacion etiqueta,
            UUID autorId,
            int pagina) {

        if (pagina < 0) {
            throw new ApiException(
                    "PAGINA_INVALIDA",
                    "La página no puede ser negativa",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new ApiException(
                    "RANGO_FECHAS_INVALIDO",
                    "La fecha desde no puede ser posterior a hasta",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Reutiliza los permisos y las restricciones de visibilidad (4.1 y 4.4).
        List<AporteResponse> observaciones = aporteService.listar(
                proyectoId,
                TipoAporte.OBSERVACION,
                false
        );
        List<AporteResponse> registrosAbc = aporteService.listar(
                proyectoId,
                TipoAporte.ABC,
                false
        );

        List<AporteResponse> entradas = new ArrayList<>(observaciones.size() + registrosAbc.size());
        entradas.addAll(observaciones);
        entradas.addAll(registrosAbc);

        // Filtrar antes de paginar.
        List<AporteResponse> filtradas = entradas.stream()
                .filter(aporte -> {
                    MetadatosBitacora meta = leerMetadatos(aporte);

                    LocalDate fecha = meta.fecha().toLocalDate();

                    return (desde == null || !fecha.isBefore(desde))
                            && (hasta == null || !fecha.isAfter(hasta))
                            && (contexto == null || meta.contexto() == contexto)
                            && (etiqueta == null || meta.etiquetas().contains(etiqueta))
                            && (autorId == null || autorId.equals(aporte.autorId()));
                })
                .sorted(Comparator.comparing(
                        (AporteResponse aporte) ->
                                leerMetadatos(aporte).fecha().toInstant()
                ).reversed())
                .toList();

        long inicio = (long) pagina * TAMANIO_PAGINA;

        if (inicio >= filtradas.size()) {
            return List.of();
        }

        int desdeIndice = (int) inicio;
        int hastaIndice = (int) Math.min(
                inicio + TAMANIO_PAGINA,
                filtradas.size()
        );

        return filtradas.subList(desdeIndice, hastaIndice);
    }

    private record MetadatosBitacora(
            OffsetDateTime fecha,
            ContextoObservacion contexto,
            Set<EtiquetaObservacion> etiquetas
    ) {
    }

    private MetadatosBitacora leerMetadatos(AporteResponse aporte) {
        if (aporte.tipo() == TipoAporte.ABC) {
            return leerMetadatosAbc(aporte);
        }
        DatosObservacion datos = leerDatosObservacion(aporte);
        return new MetadatosBitacora(datos.fecha(), datos.contexto(), datos.etiquetas());
    }

    private DatosObservacion leerDatosObservacion(AporteResponse aporte) {
        try {
            DatosObservacion datos = mapper.readValue(
                    aporte.datos(),
                    DatosObservacion.class
            );

            if (datos.fecha() == null ||
                    datos.contexto() == null ||
                    datos.etiquetas() == null) {
                throw new ApiException(
                        "DATOS_OBSERVACION_INVALIDOS",
                        "La observación tiene datos incompletos",
                        HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return datos;

        } catch (JsonProcessingException e) {
            throw new ApiException(
                    "DATOS_OBSERVACION_INVALIDOS",
                    "No se pudieron leer los datos de la observación",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private MetadatosBitacora leerMetadatosAbc(AporteResponse aporte) {
        try {
            DatosAbc datos = mapper.readValue(
                    aporte.datos(),
                    DatosAbc.class
            );

            if (datos.fecha() == null || datos.contexto() == null) {
                throw new ApiException(
                        "DATOS_ABC_INVALIDOS",
                        "El registro ABC tiene datos incompletos",
                        HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return new MetadatosBitacora(datos.fecha(), datos.contexto(), Set.of());

        } catch (JsonProcessingException e) {
            throw new ApiException(
                    "DATOS_ABC_INVALIDOS",
                    "No se pudieron leer los datos del registro ABC",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
