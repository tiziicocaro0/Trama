package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;

import com.trama.tpo.demo.entity.dto.InvitacionRequest;
import com.trama.tpo.demo.entity.dto.InvitacionResponse;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.InvitacionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;
import com.trama.tpo.demo.service.InvitacionService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.UsuarioActual;

@ExtendWith(MockitoExtension.class)
class InvitacionServiceTest {

    @Mock
    private InvitacionRepository invitacionRepository;

    @Mock
    private ProyectoRepository proyectoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private PermisoService permisoService;

    @Mock
    private UsuarioActual usuarioActual;

    @Mock
    private EmailService emailService;

    private InvitacionService invitacionService;

    @BeforeEach
    void preparar() {

        invitacionService = new InvitacionService(
                invitacionRepository,
                proyectoRepository,
                usuarioRepository,
                membresiaRepository,
                permisoService,
                usuarioActual,
                emailService,
                "https://trama.example/invitacion"
        );
    }

    @Test
    void tutorAdminCreaInvitacionConTokenSeguro() throws Exception {

        UUID proyectoId = UUID.randomUUID();
        UUID tutorId = UUID.randomUUID();

        Proyecto proyecto = Proyecto.builder()
                .id(proyectoId)
                .build();

        Usuario tutor = Usuario.builder()
                .id(tutorId)
                .build();

        when(proyectoRepository.findById(proyectoId))
                .thenReturn(Optional.of(proyecto));

        when(usuarioActual.obtenerId())
                .thenReturn(tutorId);

        when(usuarioRepository.findById(tutorId))
                .thenReturn(Optional.of(tutor));

        when(usuarioRepository.findByEmail("docente@ejemplo.test"))
                .thenReturn(Optional.empty());

        when(invitacionRepository.findByProyectoIdAndEstado(
                proyectoId, EstadoInvitacion.PENDIENTE))
                .thenReturn(List.of());

        when(invitacionRepository.saveAndFlush(any(Invitacion.class)))
                .thenAnswer(invocacion -> {

                    Invitacion invitacion = invocacion.getArgument(0);
                    invitacion.setId(UUID.randomUUID());

                    return invitacion;
                });

        InvitacionRequest request = new InvitacionRequest(
                "  DOCENTE@EJEMPLO.TEST  ",
                Rol.EDUCACION
        );

        Instant antes = Instant.now();

        InvitacionResponse respuesta =
                invitacionService.crearInvitacion(proyectoId, request);

        Instant despues = Instant.now();

        // Verificar que se comprobaron los permisos.
        verify(permisoService).verificarAdmin(proyectoId);

        // Capturar la invitacion que se guardaria en MySQL.
        ArgumentCaptor<Invitacion> invitacionCaptor =
                ArgumentCaptor.forClass(Invitacion.class);

        verify(invitacionRepository)
                .saveAndFlush(invitacionCaptor.capture());

        Invitacion guardada = invitacionCaptor.getValue();

        assertEquals("docente@ejemplo.test", guardada.getEmail());
        assertEquals(Rol.EDUCACION, guardada.getRol());
        assertEquals(EstadoInvitacion.PENDIENTE, guardada.getEstado());

        // El vencimiento debe ser de siete dias.
        assertFalse(guardada.getVenceEn()
                .isBefore(antes.plus(7, ChronoUnit.DAYS)));

        assertFalse(guardada.getVenceEn()
                .isAfter(despues.plus(7, ChronoUnit.DAYS)));

        // Capturar el enlace que recibira EmailService.
        ArgumentCaptor<String> enlaceCaptor =
                ArgumentCaptor.forClass(String.class);

        verify(emailService).enviarInvitacion(
                eq("docente@ejemplo.test"),
                eq("compartido"),
                enlaceCaptor.capture()
        );

        String enlace = enlaceCaptor.getValue();

        String prefijo =
                "https://trama.example/invitacion/";

        assertTrue(enlace.startsWith(prefijo));

        String tokenOriginal = enlace.substring(prefijo.length());

        // Comprobar que se guardo el SHA-256 y NO el token original.
        String hashEsperado = HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256")
                        .digest(tokenOriginal.getBytes(StandardCharsets.UTF_8))
        );

        assertEquals(hashEsperado, guardada.getTokenHash());
        assertNotEquals(tokenOriginal, guardada.getTokenHash());

        // Comprobar la respuesta de nuestro servicio.
        assertNotNull(respuesta.getId());
        assertEquals("docente@ejemplo.test", respuesta.getEmail());
        assertEquals(EstadoInvitacion.PENDIENTE, respuesta.getEstado());
    }

    @Test
    void usuarioSinPermisosNoPuedeInvitar() {

        UUID proyectoId = UUID.randomUUID();

        doThrow(new AccessDeniedException("Sin permisos"))
                .when(permisoService)
                .verificarAdmin(proyectoId);

        InvitacionRequest request = new InvitacionRequest(
                "docente@ejemplo.test",
                Rol.EDUCACION
        );

        assertThrows(
                AccessDeniedException.class,
                () -> invitacionService.crearInvitacion(proyectoId, request)
        );

        // No se debe guardar ni enviar nada.
        verifyNoInteractions(invitacionRepository, emailService);
    }

    @Test
    void tutorAdminPuedeInvitarConRolTutor() {

        UUID proyectoId = UUID.randomUUID();
        UUID tutorId = UUID.randomUUID();

        Proyecto proyecto = Proyecto.builder()
                .id(proyectoId)
                .build();

        Usuario tutor = Usuario.builder()
                .id(tutorId)
                .build();

        when(proyectoRepository.findById(proyectoId))
                .thenReturn(Optional.of(proyecto));

        when(usuarioActual.obtenerId())
                .thenReturn(tutorId);

        when(usuarioRepository.findById(tutorId))
                .thenReturn(Optional.of(tutor));

        when(usuarioRepository.findByEmail("cotutor@ejemplo.test"))
                .thenReturn(Optional.empty());

        when(invitacionRepository.findByProyectoIdAndEstado(
                proyectoId, EstadoInvitacion.PENDIENTE))
                .thenReturn(List.of());

        when(invitacionRepository.saveAndFlush(any(Invitacion.class)))
                .thenAnswer(invocacion -> {
                    Invitacion invitacion = invocacion.getArgument(0);
                    invitacion.setId(UUID.randomUUID());
                    return invitacion;
                });

        InvitacionRequest request = new InvitacionRequest(
                "cotutor@ejemplo.test",
                Rol.TUTOR
        );

        InvitacionResponse respuesta =
                invitacionService.crearInvitacion(proyectoId, request);

        verify(permisoService).verificarAdmin(proyectoId);
        assertEquals(Rol.TUTOR, respuesta.getRol());
        assertEquals("cotutor@ejemplo.test", respuesta.getEmail());
    }

    @Test
    void noSePuedeInvitarSinRol() {

        UUID proyectoId = UUID.randomUUID();

        InvitacionRequest request = new InvitacionRequest(
                "persona@ejemplo.test",
                null
        );

        ApiException excepcion = assertThrows(
                ApiException.class,
                () -> invitacionService.crearInvitacion(proyectoId, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, excepcion.getEstado());
        assertEquals("ROL_INVALIDO", excepcion.getCodigo());

        verifyNoInteractions(invitacionRepository, emailService);
    }

    @Test
    void noSePuedeInvitarAAlguienQueYaEsMiembro() {

        UUID proyectoId = UUID.randomUUID();
        UUID tutorId = UUID.randomUUID();
        UUID miembroId = UUID.randomUUID();

        Proyecto proyecto = Proyecto.builder()
                .id(proyectoId)
                .build();

        Usuario tutor = Usuario.builder()
                .id(tutorId)
                .build();

        Usuario miembro = Usuario.builder()
                .id(miembroId)
                .email("docente@ejemplo.test")
                .build();

        when(proyectoRepository.findById(proyectoId))
                .thenReturn(Optional.of(proyecto));

        when(usuarioActual.obtenerId())
                .thenReturn(tutorId);

        when(usuarioRepository.findById(tutorId))
                .thenReturn(Optional.of(tutor));

        when(usuarioRepository.findByEmail("docente@ejemplo.test"))
                .thenReturn(Optional.of(miembro));

        when(membresiaRepository.existsByUsuarioIdAndProyectoId(
                miembroId, proyectoId))
                .thenReturn(true);

        InvitacionRequest request = new InvitacionRequest(
                "docente@ejemplo.test",
                Rol.EDUCACION
        );

        ApiException excepcion = assertThrows(
                ApiException.class,
                () -> invitacionService.crearInvitacion(proyectoId, request)
        );

        assertEquals(HttpStatus.CONFLICT, excepcion.getEstado());
        assertEquals("YA_ES_MIEMBRO", excepcion.getCodigo());

        // No debe guardar una nueva invitacion.
        verify(invitacionRepository, never())
                .saveAndFlush(any(Invitacion.class));

        // Tampoco debe enviar un correo.
        verifyNoInteractions(emailService);
    }

    @Test
    void noSePuedeDuplicarUnaInvitacionPendiente() {

        UUID proyectoId = UUID.randomUUID();
        UUID tutorId = UUID.randomUUID();

        Proyecto proyecto = Proyecto.builder()
                .id(proyectoId)
                .build();

        Usuario tutor = Usuario.builder()
                .id(tutorId)
                .build();

        // Ya existe una invitacion pendiente y vigente.
        Invitacion invitacionExistente = Invitacion.builder()
                .proyecto(proyecto)
                .email("docente@ejemplo.test")
                .rol(Rol.EDUCACION)
                .estado(EstadoInvitacion.PENDIENTE)
                .venceEn(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();

        when(proyectoRepository.findById(proyectoId))
                .thenReturn(Optional.of(proyecto));

        when(usuarioActual.obtenerId())
                .thenReturn(tutorId);

        when(usuarioRepository.findById(tutorId))
                .thenReturn(Optional.of(tutor));

        when(usuarioRepository.findByEmail("docente@ejemplo.test"))
                .thenReturn(Optional.empty());

        when(invitacionRepository.findByProyectoIdAndEstado(
                proyectoId, EstadoInvitacion.PENDIENTE))
                .thenReturn(List.of(invitacionExistente));

        InvitacionRequest request = new InvitacionRequest(
                "docente@ejemplo.test",
                Rol.EDUCACION
        );

        ApiException excepcion = assertThrows(
                ApiException.class,
                () -> invitacionService.crearInvitacion(proyectoId, request)
        );

        assertEquals(HttpStatus.CONFLICT, excepcion.getEstado());
        assertEquals("INVITACION_EXISTENTE", excepcion.getCodigo());

        // No debe guardar otra invitacion.
        verify(invitacionRepository, never())
                .saveAndFlush(any(Invitacion.class));

        // Tampoco debe enviar otro correo.
        verifyNoInteractions(emailService);
    }

}
