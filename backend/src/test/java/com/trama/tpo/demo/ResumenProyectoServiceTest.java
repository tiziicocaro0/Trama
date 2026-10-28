package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.ResumenProyectoResponse;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.AporteService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.UsuarioActual;

@ExtendWith(MockitoExtension.class)
class ResumenProyectoServiceTest {

    @Mock private AporteRepository aporteRepository;
    @Mock private AporteVersionRepository aporteVersionRepository;
    @Mock private ProyectoRepository proyectoRepository;
    @Mock private UsuarioRepository usuarioRepository;
    @Mock private MembresiaRepository membresiaRepository;
    @Mock private PermisoService permisoService;
    @Mock private UsuarioActual usuarioActual;
    @Mock private ArchivoRepository archivoRepository;

    private AporteService aporteService;

    private final UUID proyectoId = UUID.randomUUID();
    private final UUID usuarioId = UUID.randomUUID();
    private Proyecto proyecto;
    private Usuario autor;

    @BeforeEach
    void preparar() {
        aporteService = new AporteService(
                aporteRepository,
                aporteVersionRepository,
                proyectoRepository,
                usuarioRepository,
                membresiaRepository,
                permisoService,
                usuarioActual,
                archivoRepository
        );
        proyecto = Proyecto.builder().id(proyectoId).nombre("Tomás").build();
        autor = Usuario.builder().id(usuarioId).nombre("Marta").apellido("Fernández").build();
    }

    @Test
    void obtenerResumenAgrupaSeccionesVigentesYOrdenaInteresesPorIntensidad() {
        when(usuarioActual.obtenerId()).thenReturn(usuarioId);
        when(membresiaRepository.findRol(usuarioId, proyectoId))
                .thenReturn(Optional.of(Rol.EDUCACION));
        when(permisoService.puedeEditar(proyectoId)).thenReturn(true);

        Aporte interesBaja = crearAporte(
                TipoAporte.INTERES,
                "Rompecabezas",
                "{\"categoria\":\"JUEGO\",\"intensidad\":\"BAJA\"}"
        );
        Aporte interesAlta = crearAporte(
                TipoAporte.INTERES,
                "Dinosaurios",
                "{\"categoria\":\"TEMA\",\"intensidad\":\"ALTA\"}"
        );
        Aporte fortaleza = crearAporte(
                TipoAporte.FORTALEZA,
                "Excelente memoria visual",
                "{\"contexto\":\"ESCUELA\"}"
        );
        Aporte comunicacion = crearAporte(
                TipoAporte.COMUNICACION,
                "Frases cortas y anticipación con pictogramas",
                null
        );
        Aporte sensorial = crearAporte(
                TipoAporte.SENSORIAL,
                "Sensibilidad a timbres fuertes",
                null
        );
        Aporte desregulacion = crearAporte(
                TipoAporte.DESREGULACION,
                "Llevar a un rincón tranquilo y bajar estímulos",
                null
        );

        when(aporteRepository.buscarAportesVigentesPorTiposYVisibilidad(
                eq(proyectoId),
                any(),
                eq(List.of(Visibilidad.TODOS, Visibilidad.SOLO_EDUCACION))
        )).thenReturn(List.of(
                interesBaja,
                interesAlta,
                fortaleza,
                comunicacion,
                sensorial,
                desregulacion
        ));

        ResumenProyectoResponse resumen = aporteService.obtenerResumen(proyectoId);

        verify(permisoService).verificarMiembro(proyectoId);
        assertThat(resumen.intereses())
                .extracting(item -> item.titulo())
                .containsExactly("Dinosaurios", "Rompecabezas");
        assertThat(resumen.fortalezas()).hasSize(1);
        assertThat(resumen.comunicacion()).hasSize(1);
        assertThat(resumen.sensorial()).hasSize(1);
        assertThat(resumen.desregulacion()).hasSize(1);
    }

    @Test
    void obtenerResumenRechazaCon403SiNoEsMiembro() {
        doThrow(new AccessDeniedException("No tenés acceso a este proyecto"))
                .when(permisoService).verificarMiembro(proyectoId);

        assertThatThrownBy(() -> aporteService.obtenerResumen(proyectoId))
                .isInstanceOf(AccessDeniedException.class);
    }

    private Aporte crearAporte(TipoAporte tipo, String titulo, String datos) {
        Instant ahora = Instant.now();
        return Aporte.builder()
                .id(UUID.randomUUID())
                .proyecto(proyecto)
                .autor(autor)
                .tipo(tipo)
                .titulo(titulo)
                .contenido("Detalle de " + titulo)
                .datos(datos)
                .visibilidad(Visibilidad.TODOS)
                .archivado(false)
                .creadoEn(ahora)
                .actualizadoEn(ahora)
                .build();
    }
}

