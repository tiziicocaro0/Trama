package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

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
import com.trama.tpo.demo.aporte.EstadoRevision;
import com.trama.tpo.demo.aporte.SolicitudRevision;
import com.trama.tpo.demo.entity.dto.SolicitudRevisionRequest;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.SolicitudRevisionRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.NotificacionService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.SolicitudRevisionService;
import com.trama.tpo.demo.service.UsuarioActual;
import com.trama.tpo.demo.exceptions.ApiException;

@ExtendWith(MockitoExtension.class)
class SolicitudRevisionServiceTest {

    @Mock
    private SolicitudRevisionRepository revisionRepository;

    @Mock
    private AporteRepository aporteRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioActual usuarioActual;

    @Mock
    private PermisoService permisoService;

    @Mock
    private NotificacionService notificacionService;

    private SolicitudRevisionService revisionService;

    // Prepara el servicio antes de ejecutar cada prueba.
    @BeforeEach
    void preparar() {
        revisionService = new SolicitudRevisionService(
                revisionRepository,
                aporteRepository,
                usuarioRepository,
                usuarioActual,
                permisoService,
                notificacionService
        );
    }

    @Test
    void tutorPuedeSolicitarRevisionYSeNotificaAlAutor() {

        // Identificadores ficticios para la prueba.
        UUID proyectoId = UUID.randomUUID();
        UUID aporteId = UUID.randomUUID();
        UUID tutorId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();

        Usuario tutor = Usuario.builder()
                .id(tutorId)
                .build();

        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(aporteId)
                .autor(autor)
                .titulo("Interés por los dinosaurios")
                .build();

        // Simula que el aporte existe dentro del proyecto.
        when(aporteRepository.findByIdAndProyectoId(aporteId, proyectoId))
                .thenReturn(Optional.of(aporte));

        // Simula que el usuario autenticado es el tutor.
        when(usuarioActual.obtenerId()).thenReturn(tutorId);

        when(usuarioRepository.findById(tutorId))
                .thenReturn(Optional.of(tutor));

        // No existe una solicitud pendiente para este aporte.
        when(revisionRepository.existsByAporteIdAndEstado(
                aporteId, EstadoRevision.PENDIENTE))
                .thenReturn(false);

        // Simula el guardado de la solicitud.
        when(revisionRepository.save(any(SolicitudRevision.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));

        SolicitudRevisionRequest request =
                new SolicitudRevisionRequest(
                        "Actualizar la descripción del interés"
                );

        // Ejecuta la funcionalidad que estamos probando.
        SolicitudRevision resultado =
                revisionService.solicitarRevision(
                        proyectoId,
                        aporteId,
                        request
                );

        // Comprueba que la solicitud se creó correctamente.
        assertNotNull(resultado);
        assertEquals(EstadoRevision.PENDIENTE, resultado.getEstado());
        assertEquals(aporteId, resultado.getAporte().getId());
        assertEquals(tutorId, resultado.getSolicitante().getId());
        assertEquals(
                "Actualizar la descripción del interés",
                resultado.getMotivo()
        );

        // Comprueba que se verificaron los permisos de tutor.
        verify(permisoService).verificarTutor(proyectoId);

        // Comprueba que se guardó la solicitud.
        verify(revisionRepository).save(any(SolicitudRevision.class));

        // Comprueba que se notificó al autor original.
        verify(notificacionService).notificar(
                eq(List.of(autorId)),
                eq(proyectoId),
                eq("REVISION_APORTE"),
                contains("Interés por los dinosaurios"),
                eq("/proyectos/" + proyectoId + "/aportes/" + aporteId)
        );
    }

    @Test
    void usuarioSinPermisoDeTutorNoPuedeSolicitarRevision() {

        UUID proyectoId = UUID.randomUUID();
        UUID aporteId = UUID.randomUUID();

        // Simula que el usuario no tiene rol de tutor.
        doThrow(new AccessDeniedException("Solo los tutores pueden solicitar revisiones"))
                .when(permisoService)
                .verificarTutor(proyectoId);

        SolicitudRevisionRequest request =
                new SolicitudRevisionRequest("Corregir la descripción");

        // La operación debe rechazar el acceso.
        assertThrows(
                AccessDeniedException.class,
                () -> revisionService.solicitarRevision(
                        proyectoId,
                        aporteId,
                        request
                )
        );

        // Comprueba que se verificaron los permisos.
        verify(permisoService).verificarTutor(proyectoId);

        // No debe guardarse ninguna solicitud.
        verify(revisionRepository, never())
                .save(any(SolicitudRevision.class));

        // No debe enviarse ninguna notificación.
        verifyNoInteractions(notificacionService);
    }

    @Test
    void noPermiteDosSolicitudesDeRevisionPendientes() {

        UUID proyectoId = UUID.randomUUID();
        UUID aporteId = UUID.randomUUID();
        UUID tutorId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();

        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(aporteId)
                .autor(autor)
                .titulo("Interés por los dinosaurios")
                .build();

        // El usuario autenticado es un tutor distinto del autor.
        when(usuarioActual.obtenerId()).thenReturn(tutorId);

        when(aporteRepository.findByIdAndProyectoId(aporteId, proyectoId))
                .thenReturn(Optional.of(aporte));

        // Ya existe una solicitud pendiente para este aporte.
        when(revisionRepository.existsByAporteIdAndEstado(
                aporteId, EstadoRevision.PENDIENTE))
                .thenReturn(true);

        SolicitudRevisionRequest request =
                new SolicitudRevisionRequest("Actualizar la descripción");

        // Se debe rechazar la segunda solicitud.
        assertThrows(
                RuntimeException.class,
                () -> revisionService.solicitarRevision(
                        proyectoId,
                        aporteId,
                        request
                )
        );

        // Se comprueba que se verificaron los permisos del tutor.
        verify(permisoService).verificarTutor(proyectoId);

        // No debe guardarse una segunda solicitud.
        verify(revisionRepository, never())
                .save(any(SolicitudRevision.class));

        // No debe enviarse otra notificación.
        verifyNoInteractions(notificacionService);
    }

    @Test
    void soloElAutorPuedeMarcarRevisionComoRevisada() {

        UUID proyectoId = UUID.randomUUID();
        UUID revisionId = UUID.randomUUID();
        UUID aporteId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();

        // El aporte pertenece a un autor específico.
        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(aporteId)
                .autor(autor)
                .build();

        SolicitudRevision revision = SolicitudRevision.builder()
                .aporte(aporte)
                .estado(EstadoRevision.PENDIENTE)
                .build();

        // Simula que la solicitud de revisión existe.
        when(revisionRepository.findByIdAndAporteProyectoId(
                revisionId, proyectoId))
                .thenReturn(Optional.of(revision));

        // Simula que el usuario autenticado no es el autor.
        doThrow(new AccessDeniedException(
                "Solo el autor puede modificar este aporte"))
                .when(permisoService)
                .verificarAutor(autorId);

        // Un usuario distinto del autor intenta cerrar la revisión.
        assertThrows(
                AccessDeniedException.class,
                () -> revisionService.marcarComoRevisada(
                        proyectoId,
                        revisionId
                )
        );

        // Comprueba que se verificó la pertenencia al proyecto.
        verify(permisoService).verificarMiembro(proyectoId);

        // Comprueba que se verificó la autoría.
        verify(permisoService).verificarAutor(autorId);

        // La revisión debe continuar pendiente.
        assertEquals(EstadoRevision.PENDIENTE, revision.getEstado());

        // No debe guardarse ningún cambio.
        verify(revisionRepository, never())
                .save(any(SolicitudRevision.class));
    }

    @Test
    void autorPuedeMarcarRevisionComoRevisada() {

        UUID proyectoId = UUID.randomUUID();
        UUID revisionId = UUID.randomUUID();
        UUID aporteId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();

        // El aporte pertenece al autor original.
        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(aporteId)
                .autor(autor)
                .build();

        // La solicitud comienza en estado PENDIENTE.
        SolicitudRevision revision = SolicitudRevision.builder()
                .aporte(aporte)
                .estado(EstadoRevision.PENDIENTE)
                .build();

        // Simula que la solicitud existe dentro del proyecto.
        when(revisionRepository.findByIdAndAporteProyectoId(
                revisionId, proyectoId))
                .thenReturn(Optional.of(revision));

        // Simula que el repositorio guarda la revisión actualizada.
        when(revisionRepository.save(any(SolicitudRevision.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));

        // Ejecuta la operación.
        SolicitudRevision resultado =
                revisionService.marcarComoRevisada(
                        proyectoId,
                        revisionId
                );

        // Comprueba los permisos.
        verify(permisoService).verificarMiembro(proyectoId);
        verify(permisoService).verificarAutor(autorId);

        // Comprueba que cambió el estado.
        assertEquals(EstadoRevision.REVISADA, resultado.getEstado());

        // Comprueba que se guardó el cambio.
        verify(revisionRepository).save(revision);

        // No debe enviarse una notificación adicional.
        verifyNoInteractions(notificacionService);
    }

    @Test
    void noPermiteMarcarDosVecesUnaRevisionComoRevisada() {

        UUID proyectoId = UUID.randomUUID();
        UUID revisionId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();

        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(UUID.randomUUID())
                .autor(autor)
                .build();

        // La solicitud ya está completada.
        SolicitudRevision revision = SolicitudRevision.builder()
                .aporte(aporte)
                .estado(EstadoRevision.REVISADA)
                .build();

        when(revisionRepository.findByIdAndAporteProyectoId(
                revisionId, proyectoId))
                .thenReturn(Optional.of(revision));

        // No se puede completar nuevamente una revisión ya cerrada.
        ApiException excepcion = assertThrows(
                ApiException.class,
                () -> revisionService.marcarComoRevisada(
                        proyectoId,
                        revisionId
                )
        );

        // Comprueba que se verificaron los permisos.
        verify(permisoService).verificarMiembro(proyectoId);
        verify(permisoService).verificarAutor(autorId);

        // La solicitud continúa en estado REVISADA.
        assertEquals(EstadoRevision.REVISADA, revision.getEstado());

        // No debe guardarse ningún cambio.
        verify(revisionRepository, never())
                .save(any(SolicitudRevision.class));

        // No debe enviarse ninguna notificación.
        verifyNoInteractions(notificacionService);
    }

    @Test
    void autorPuedeConsultarMotivoDeRevision() {

        UUID proyectoId = UUID.randomUUID();
        UUID revisionId = UUID.randomUUID();
        UUID aporteId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();

        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(aporteId)
                .autor(autor)
                .build();

        SolicitudRevision revision = SolicitudRevision.builder()
                .aporte(aporte)
                .motivo("Actualizar la descripción del interés")
                .estado(EstadoRevision.PENDIENTE)
                .build();

        // Simula que la revisión existe dentro del proyecto.
        when(revisionRepository.findByIdAndAporteProyectoId(
                revisionId, proyectoId))
                .thenReturn(Optional.of(revision));

        // Consulta el motivo.
        SolicitudRevision resultado =
                revisionService.obtenerRevision(
                        proyectoId,
                        revisionId
                );

        // Verifica que se controlaron los permisos.
        verify(permisoService).verificarMiembro(proyectoId);
        verify(permisoService).verificarAutor(autorId);

        // Comprueba que se obtiene la información correcta.
        assertEquals(
                "Actualizar la descripción del interés",
                resultado.getMotivo()
        );
        assertEquals(EstadoRevision.PENDIENTE, resultado.getEstado());
        assertEquals(aporteId, resultado.getAporte().getId());

        // Consultar una revisión no debe modificarla.
        verify(revisionRepository, never())
                .save(any(SolicitudRevision.class));

        verifyNoInteractions(notificacionService);
    }

    @Test
    void usuarioQueNoEsAutorNoPuedeConsultarMotivoDeRevision() {

        UUID proyectoId = UUID.randomUUID();
        UUID revisionId = UUID.randomUUID();
        UUID aporteId = UUID.randomUUID();
        UUID autorId = UUID.randomUUID();

        // El aporte pertenece a otro usuario.
        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(aporteId)
                .autor(autor)
                .build();

        SolicitudRevision revision = SolicitudRevision.builder()
                .aporte(aporte)
                .motivo("Actualizar la descripción del interés")
                .estado(EstadoRevision.PENDIENTE)
                .build();

        // La revisión existe dentro del proyecto.
        when(revisionRepository.findByIdAndAporteProyectoId(
                revisionId, proyectoId))
                .thenReturn(Optional.of(revision));

        // Simula que el usuario no tiene autorización como autor.
        doThrow(new AccessDeniedException(
                "Solo el autor puede modificar este aporte"))
                .when(permisoService)
                .verificarAutor(autorId);

        // La consulta debe ser rechazada.
        assertThrows(
                AccessDeniedException.class,
                () -> revisionService.obtenerRevision(
                        proyectoId,
                        revisionId
                )
        );

        // Verifica que se controlaron los permisos.
        verify(permisoService).verificarMiembro(proyectoId);
        verify(permisoService).verificarAutor(autorId);

        // La consulta no debe modificar la revisión.
        verify(revisionRepository, never())
                .save(any(SolicitudRevision.class));

        // No debe generar notificaciones.
        verifyNoInteractions(notificacionService);
    }
}