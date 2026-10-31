package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.InvitacionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;
import com.trama.tpo.demo.service.InstitucionService;
import com.trama.tpo.demo.service.NotificacionService;
import com.trama.tpo.demo.service.InvitacionService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.RegistroAccionService;
import com.trama.tpo.demo.service.UsuarioActual;

@ExtendWith(MockitoExtension.class)
class InvitacionAceptacionServiceTest {

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

    private static final String TOKEN = "token-de-prueba";

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
                mock(RegistroAccionService.class),
                mock(InstitucionService.class),
                mock(NotificacionService.class),
                "https://trama.example/invitacion"
        );
    }

    // Crea una invitacion vigente para reutilizar en los tests.
    private Invitacion crearInvitacionVigente() {

        Proyecto proyecto = Proyecto.builder()
                .id(UUID.randomUUID())
                .nombre("Mateo")
                .build();

        return Invitacion.builder()
                .id(UUID.randomUUID())
                .proyecto(proyecto)
                .email("docente@ejemplo.test")
                .rol(Rol.EDUCACION)
                .estado(EstadoInvitacion.PENDIENTE)
                .venceEn(Instant.now().plus(1, ChronoUnit.DAYS))
                .build();
    }

    // TEST 1: aceptacion exitosa.
    @Test
    void aceptarInvitacionCreaMembresiaYMarcaInvitacionComoAceptada() {

        Invitacion invitacion = crearInvitacionVigente();

        UUID usuarioId = UUID.randomUUID();
        UUID membresiaId = UUID.randomUUID();

        Usuario usuario = Usuario.builder()
                .id(usuarioId)
                .nombre("Maria")
                .apellido("Lopez")
                .email("docente@ejemplo.test")
                .build();

        when(invitacionRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(invitacion));

        when(usuarioActual.obtenerId())
                .thenReturn(usuarioId);

        when(usuarioRepository.findById(usuarioId))
                .thenReturn(Optional.of(usuario));

        when(membresiaRepository.saveAndFlush(any(Membresia.class)))
                .thenAnswer(invocacion -> {

                    Membresia membresia = invocacion.getArgument(0);
                    membresia.setId(membresiaId);

                    return membresia;
                });

        MiembroResponse respuesta =
                invitacionService.aceptarInvitacion(TOKEN);

        // Verificamos los datos devueltos.
        assertEquals(membresiaId, respuesta.getId());
        assertEquals(usuarioId, respuesta.getUsuarioId());
        assertEquals(Rol.EDUCACION, respuesta.getRol());
        assertFalse(respuesta.getEsAdmin());

        // Verificamos que la membresia se creo correctamente.
        ArgumentCaptor<Membresia> captor =
                ArgumentCaptor.forClass(Membresia.class);

        verify(membresiaRepository).saveAndFlush(captor.capture());

        Membresia membresiaCreada = captor.getValue();

        assertEquals(usuario, membresiaCreada.getUsuario());
        assertEquals(invitacion.getProyecto(), membresiaCreada.getProyecto());
        assertEquals(Rol.EDUCACION, membresiaCreada.getRol());
        assertFalse(membresiaCreada.getEsAdmin());

        // El token queda consumido.
        assertEquals(EstadoInvitacion.ACEPTADA, invitacion.getEstado());

        verify(invitacionRepository).saveAndFlush(invitacion);

        // Se utiliza la busqueda con bloqueo, no la consulta simple.
        verify(invitacionRepository)
                .findByTokenHashForUpdate(anyString());
    }

    // TEST 2: invitacion vencida.
    @Test
    void invitacionVencidaDevuelve410() {

        Invitacion invitacion = crearInvitacionVigente();

        invitacion.setVenceEn(
                Instant.now().minus(1, ChronoUnit.DAYS)
        );

        when(invitacionRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(invitacion));

        ApiException error = assertThrows(
                ApiException.class,
                () -> invitacionService.aceptarInvitacion(TOKEN)
        );

        assertEquals(HttpStatus.GONE, error.getEstado());
        assertEquals("INVITACION_NO_DISPONIBLE", error.getCodigo());

        // No se crea ninguna membresia.
        verify(membresiaRepository, never())
                .saveAndFlush(any(Membresia.class));

        verify(invitacionRepository, never())
                .saveAndFlush(any(Invitacion.class));
    }

    // TEST 3: invitacion ya utilizada.
    @Test
    void invitacionAceptadaAnteriormenteDevuelve410() {

        Invitacion invitacion = crearInvitacionVigente();

        invitacion.setEstado(EstadoInvitacion.ACEPTADA);

        when(invitacionRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(invitacion));

        ApiException error = assertThrows(
                ApiException.class,
                () -> invitacionService.aceptarInvitacion(TOKEN)
        );

        assertEquals(HttpStatus.GONE, error.getEstado());
        assertEquals("INVITACION_NO_DISPONIBLE", error.getCodigo());

        verify(membresiaRepository, never())
                .saveAndFlush(any(Membresia.class));
    }

    // TEST 4: el usuario autenticado no es el destinatario.
    @Test
    void emailDiferenteNoPuedeAceptarInvitacion() {

        Invitacion invitacion = crearInvitacionVigente();

        UUID usuarioId = UUID.randomUUID();

        Usuario otroUsuario = Usuario.builder()
                .id(usuarioId)
                .email("otra-persona@ejemplo.test")
                .build();

        when(invitacionRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(invitacion));

        when(usuarioActual.obtenerId())
                .thenReturn(usuarioId);

        when(usuarioRepository.findById(usuarioId))
                .thenReturn(Optional.of(otroUsuario));

        ApiException error = assertThrows(
                ApiException.class,
                () -> invitacionService.aceptarInvitacion(TOKEN)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getEstado());
        assertEquals("DESTINATARIO_INCORRECTO", error.getCodigo());

        // No se crea la membresia ni se consume la invitacion.
        verify(membresiaRepository, never())
                .saveAndFlush(any(Membresia.class));

        verify(invitacionRepository, never())
                .saveAndFlush(any(Invitacion.class));

        assertEquals(EstadoInvitacion.PENDIENTE, invitacion.getEstado());
    }

    // TEST 5 (1.6): aceptar invitacion con rol TUTOR crea membresia con esAdmin=true.
    @Test
    void aceptarInvitacionTutorCreaMembresiaComoAdmin() {

        Invitacion invitacion = crearInvitacionVigente();
        invitacion.setRol(Rol.TUTOR);
        invitacion.setEmail("cotutor@ejemplo.test");

        UUID usuarioId = UUID.randomUUID();
        UUID membresiaId = UUID.randomUUID();

        Usuario usuario = Usuario.builder()
                .id(usuarioId)
                .nombre("Carlos")
                .apellido("Gomez")
                .email("cotutor@ejemplo.test")
                .build();

        when(invitacionRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(invitacion));

        when(usuarioActual.obtenerId())
                .thenReturn(usuarioId);

        when(usuarioRepository.findById(usuarioId))
                .thenReturn(Optional.of(usuario));

        when(membresiaRepository.saveAndFlush(any(Membresia.class)))
                .thenAnswer(invocacion -> {
                    Membresia membresia = invocacion.getArgument(0);
                    membresia.setId(membresiaId);
                    return membresia;
                });

        MiembroResponse respuesta =
                invitacionService.aceptarInvitacion(TOKEN);

        assertEquals(Rol.TUTOR, respuesta.getRol());
        assertTrue(respuesta.getEsAdmin());

        ArgumentCaptor<Membresia> captor =
                ArgumentCaptor.forClass(Membresia.class);

        verify(membresiaRepository).saveAndFlush(captor.capture());

        Membresia membresiaCreada = captor.getValue();
        assertEquals(Rol.TUTOR, membresiaCreada.getRol());
        assertTrue(membresiaCreada.getEsAdmin());
    }
}
