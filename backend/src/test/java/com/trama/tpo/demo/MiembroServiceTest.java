package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;

import com.trama.tpo.demo.entity.dto.MiembroResponse;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.service.MiembroService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.RegistroAccionService;
import com.trama.tpo.demo.service.UsuarioActual;

@ExtendWith(MockitoExtension.class)
class MiembroServiceTest {

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private PermisoService permisoService;

    @Mock
    private UsuarioActual usuarioActual;

    private MiembroService miembroService;

    @BeforeEach
    void preparar() {
        miembroService = new MiembroService(
                membresiaRepository, permisoService, usuarioActual, mock(RegistroAccionService.class));
    }

    @Test
    void hacerCoTutorConvierteFamiliarEnTutorAdmin() {
        UUID proyectoId = UUID.randomUUID();
        UUID miembroId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();

        Usuario usuario = Usuario.builder()
                .id(usuarioId)
                .nombre("Ana")
                .apellido("Perez")
                .build();

        Membresia membresiaFamiliar = Membresia.builder()
                .id(miembroId)
                .usuario(usuario)
                .proyecto(Proyecto.builder().id(proyectoId).build())
                .rol(Rol.FAMILIAR)
                .esAdmin(false)
                .build();

        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(membresiaFamiliar));

        when(membresiaRepository.saveAndFlush(any(Membresia.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));

        MiembroResponse respuesta = miembroService.hacerCoTutor(proyectoId, miembroId);

        verify(permisoService).verificarAdmin(proyectoId);
        assertEquals(Rol.TUTOR, respuesta.getRol());
        assertTrue(respuesta.getEsAdmin());
    }

    @Test
    void noAdminNoPuedeHacerCoTutor() {
        UUID proyectoId = UUID.randomUUID();
        UUID miembroId = UUID.randomUUID();

        doThrow(new AccessDeniedException("Sin permisos"))
                .when(permisoService)
                .verificarAdmin(proyectoId);

        assertThrows(
                AccessDeniedException.class,
                () -> miembroService.hacerCoTutor(proyectoId, miembroId)
        );

        verifyNoInteractions(membresiaRepository);
    }

    @Test
    void noSePuedeConvertirEnCoTutorSiNoEsFamiliar() {
        UUID proyectoId = UUID.randomUUID();
        UUID miembroId = UUID.randomUUID();

        Membresia membresiaEducacion = Membresia.builder()
                .id(miembroId)
                .usuario(Usuario.builder().id(UUID.randomUUID()).nombre("Docente").apellido("Test").build())
                .proyecto(Proyecto.builder().id(proyectoId).build())
                .rol(Rol.EDUCACION)
                .esAdmin(false)
                .build();

        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(membresiaEducacion));

        ApiException excepcion = assertThrows(
                ApiException.class,
                () -> miembroService.hacerCoTutor(proyectoId, miembroId)
        );

        assertEquals(HttpStatus.BAD_REQUEST, excepcion.getEstado());
        assertEquals("ROL_NO_CONVERTIBLE", excepcion.getCodigo());
    }
}

