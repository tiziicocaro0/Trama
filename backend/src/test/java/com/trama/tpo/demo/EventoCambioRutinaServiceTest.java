package com.trama.tpo.demo;

import com.trama.tpo.demo.entity.dto.EventoRequest;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;
import com.trama.tpo.demo.service.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventoCambioRutinaServiceTest {

    @Mock EventoRepository eventoRepository;
    @Mock EventoExcepcionRepository excepcionRepository;
    @Mock ProyectoRepository proyectoRepository;
    @Mock UsuarioRepository usuarioRepository;
    @Mock MembresiaRepository membresiaRepository;
    @Mock ArchivoRepository archivoRepository;
    @Mock PermisoService permisoService;
    @Mock UsuarioActual usuarioActual;
    @Mock AcuerdoRepository acuerdoRepository;
    @Mock NotificacionService notificacionService;

    @InjectMocks
    EventoService eventoService;

    @Test
    void cambioDeRutinaNotificaATodosExceptoAlAutor() {

        // 1. Proyecto y cuatro usuarios de prueba
        UUID proyectoId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();
        UUID tutorId = UUID.randomUUID();
        UUID familiarId = UUID.randomUUID();
        UUID profesionalId = UUID.randomUUID();

        Proyecto proyecto = Proyecto.builder()
                .id(proyectoId)
                .nombre("Proyecto de prueba")
                .build();

        Usuario autor = Usuario.builder()
                .id(autorId)
                .nombre("Maria")
                .build();

        Usuario tutor = Usuario.builder()
                .id(tutorId)
                .build();

        Usuario familiar = Usuario.builder()
                .id(familiarId)
                .build();

        Usuario profesional = Usuario.builder()
                .id(profesionalId)
                .build();

        // 2. Simulamos la autenticacion
        when(usuarioActual.obtenerId()).thenReturn(autorId);

        when(proyectoRepository.findById(proyectoId))
                .thenReturn(Optional.of(proyecto));

        when(usuarioRepository.findById(autorId))
                .thenReturn(Optional.of(autor));

        // 3. Simulamos las membresias del proyecto
        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(
                        Membresia.builder().usuario(autor).build(),
                        Membresia.builder().usuario(tutor).build(),
                        Membresia.builder().usuario(familiar).build(),
                        Membresia.builder().usuario(profesional).build()
                ));

        // 4. Simulamos el guardado sin utilizar MySQL
        when(eventoRepository.saveAndFlush(any(Evento.class)))
                .thenAnswer(invocacion -> {
                    Evento evento = invocacion.getArgument(0);
                    evento.setId(UUID.randomUUID());
                    return evento;
                });

        // 5. Creamos una solicitud de cambio de rutina
        EventoRequest request = new EventoRequest(
                "Cambio de horario",
                "Se modifico una actividad",
                LocalDate.of(2026, 11, 10),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                null,
                false,
                null,
                null,
                "COMUN",
                List.of(),
                true
        );

        eventoService.crear(proyectoId, request);

        // 6. Verificamos que se guardo como cambio de rutina
        verify(eventoRepository).saveAndFlush(
                argThat(evento ->
                        Boolean.TRUE.equals(evento.getEsCambio()))
        );

        // 7. Verificamos que se notifique a los otros tres
        // miembros, sin incluir a Maria
        verify(notificacionService).notificar(
                eq(List.of(tutorId, familiarId, profesionalId)),
                eq(proyectoId),
                eq(TipoNotificacion.CAMBIO_CALENDARIO.name()),
                eq("Se registró un cambio de rutina en el calendario."),
                eq("/proyectos/" + proyectoId + "/calendario")
        );
    }
    
@Test
void eventoNormalNoGeneraNotificaciones() {

    UUID proyectoId = UUID.randomUUID();
    UUID autorId = UUID.randomUUID();

    Proyecto proyecto = Proyecto.builder()
            .id(proyectoId)
            .build();

    Usuario autor = Usuario.builder()
            .id(autorId)
            .build();

    when(usuarioActual.obtenerId()).thenReturn(autorId);

    when(proyectoRepository.findById(proyectoId))
            .thenReturn(Optional.of(proyecto));

    when(usuarioRepository.findById(autorId))
            .thenReturn(Optional.of(autor));

    when(eventoRepository.saveAndFlush(any(Evento.class)))
            .thenAnswer(invocacion -> {
                Evento evento = invocacion.getArgument(0);
                evento.setId(UUID.randomUUID());
                return evento;
            });

    EventoRequest request = new EventoRequest(
            "Actividad habitual",
            "Clase de educación física",
            LocalDate.of(2026, 11, 10),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            null,
            false,
            null,
            null,
            "COMUN",
            List.of(),
            false
    );

    eventoService.crear(proyectoId, request);

    // El evento se guarda como un evento normal.
    verify(eventoRepository).saveAndFlush(
            argThat(evento ->
                    Boolean.FALSE.equals(evento.getEsCambio()))
    );

    // No se envían notificaciones.
    verifyNoInteractions(notificacionService);
}

@Test
void editarCambioDeRutinaNotificaExceptoAlEditor() {

    UUID proyectoId = UUID.randomUUID();
    UUID eventoId = UUID.randomUUID();
    UUID editorId = UUID.randomUUID();
    UUID tutorId = UUID.randomUUID();
    UUID familiarId = UUID.randomUUID();

    Proyecto proyecto = Proyecto.builder()
            .id(proyectoId)
            .build();

    Usuario editor = Usuario.builder()
            .id(editorId)
            .build();

    Usuario tutor = Usuario.builder()
            .id(tutorId)
            .build();

    Usuario familiar = Usuario.builder()
            .id(familiarId)
            .build();

    // Evento existente, inicialmente sin cambio de rutina.
    Evento evento = Evento.builder()
            .id(eventoId)
            .proyecto(proyecto)
            .autor(editor)
            .titulo("Actividad habitual")
            .fecha(LocalDate.of(2026, 11, 10))
            .horaInicio(LocalTime.of(10, 0))
            .horaFin(LocalTime.of(11, 0))
            .tipo("COMUN")
            .recurrente(false)
            .esCambio(false)
            .build();

    when(usuarioActual.obtenerId()).thenReturn(editorId);

    when(eventoRepository.findByIdAndProyectoId(
            eventoId, proyectoId))
            .thenReturn(Optional.of(evento));

    when(membresiaRepository.findByProyectoId(proyectoId))
            .thenReturn(List.of(
                    Membresia.builder().usuario(editor).build(),
                    Membresia.builder().usuario(tutor).build(),
                    Membresia.builder().usuario(familiar).build()
            ));

    when(eventoRepository.saveAndFlush(any(Evento.class)))
            .thenAnswer(invocacion -> invocacion.getArgument(0));

    // María edita el evento y lo marca como cambio de rutina.
    EventoRequest request = new EventoRequest(
            "Actividad reprogramada",
            "Se modificó la actividad habitual",
            LocalDate.of(2026, 11, 10),
            LocalTime.of(10, 0),
            LocalTime.of(11, 0),
            null,
            false,
            null,
            null,
            "COMUN",
            null,
            true
    );

    eventoService.editar(proyectoId, eventoId, request);

    // El evento se actualiza como cambio de rutina.
    verify(eventoRepository).saveAndFlush(
            argThat(guardado ->
                    Boolean.TRUE.equals(guardado.getEsCambio()))
    );

    // Se notifica al tutor y al familiar, pero no a María.
    verify(notificacionService).notificar(
            eq(List.of(tutorId, familiarId)),
            eq(proyectoId),
            eq(TipoNotificacion.CAMBIO_CALENDARIO.name()),
            eq("Se registró un cambio de rutina en el calendario."),
            eq("/proyectos/" + proyectoId + "/calendario")
    );
}

}
