package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ResumenProyectoResponse;
import com.trama.tpo.demo.service.AporteService;
import com.trama.tpo.demo.service.ResumenService;

// 2.8: el resumen se arma con los aportes que AporteService ya filtró por permisos y visibilidad.
@ExtendWith(MockitoExtension.class)
class ResumenServiceTest {

    @Mock private AporteService aporteService;
    @InjectMocks private ResumenService resumenService;

    private final UUID proyectoId = UUID.randomUUID();

    @Test
    void agrupaPorSeccionYOrdenaLosInteresesPorIntensidad() {
        when(aporteService.listar(proyectoId, null, false)).thenReturn(List.of(
                aporte(TipoAporte.INTERES, "Rompecabezas", "{\"categoria\":\"JUEGO\",\"intensidad\":\"BAJA\"}"),
                aporte(TipoAporte.INTERES, "Dinosaurios", "{\"categoria\":\"TEMA\",\"intensidad\":\"ALTA\"}"),
                aporte(TipoAporte.INTERES, "Trenes", "{\"categoria\":\"OBJETO\",\"intensidad\":\"MEDIA\"}"),
                aporte(TipoAporte.FORTALEZA, "Memoria visual", "{\"contexto\":\"ESCUELA\"}"),
                aporte(TipoAporte.COMUNICACION, "Frases breves", null),
                aporte(TipoAporte.SENSORIAL, "Timbres fuertes", null),
                aporte(TipoAporte.ESTRATEGIA, "Anticipar cambios", null),
                aporte(TipoAporte.DESREGULACION, "Rincón tranquilo", null),
                // Los tipos que no son del perfil no entran al resumen
                aporte(TipoAporte.OBSERVACION, "Observación del día", null),
                aporte(TipoAporte.NOTA_PROFESIONAL, "Nota", null)));

        ResumenProyectoResponse resumen = resumenService.obtener(proyectoId);

        assertThat(resumen.intereses()).extracting(AporteResponse::titulo)
                .containsExactly("Dinosaurios", "Trenes", "Rompecabezas");
        assertThat(resumen.fortalezas()).extracting(AporteResponse::titulo).containsExactly("Memoria visual");
        assertThat(resumen.comunicacion()).hasSize(1);
        assertThat(resumen.sensorial()).hasSize(1);
        assertThat(resumen.estrategias()).hasSize(1);
        assertThat(resumen.desregulacion()).hasSize(1);
    }

    @Test
    void unInteresConDatosIlegiblesQuedaAlFinal() {
        when(aporteService.listar(proyectoId, null, false)).thenReturn(List.of(
                aporte(TipoAporte.INTERES, "Sin datos válidos", "no es json"),
                aporte(TipoAporte.INTERES, "Música", "{\"categoria\":\"ACTIVIDAD\",\"intensidad\":\"BAJA\"}")));

        assertThat(resumenService.obtener(proyectoId).intereses())
                .extracting(AporteResponse::titulo)
                .containsExactly("Música", "Sin datos válidos");
    }

    @Test
    void siNoEsMiembroRecibe403() {
        when(aporteService.listar(proyectoId, null, false))
                .thenThrow(new AccessDeniedException("No tenés acceso a este proyecto"));

        assertThatThrownBy(() -> resumenService.obtener(proyectoId))
                .isInstanceOf(AccessDeniedException.class);
    }

    private AporteResponse aporte(TipoAporte tipo, String titulo, String datos) {
        Instant ahora = Instant.now();
        return new AporteResponse(
                UUID.randomUUID(), proyectoId, UUID.randomUUID(), "Autora Ficticia",
                tipo, titulo, null, datos, Visibilidad.TODOS, false,
                ahora, ahora, false, List.of(), List.of(), List.of());
    }
}
