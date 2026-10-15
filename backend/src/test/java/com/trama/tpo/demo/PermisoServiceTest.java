package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.UsuarioActual;

@ExtendWith(MockitoExtension.class)
class PermisoServiceTest {
    
    @Mock 
    private UsuarioActual usuarioActual;

    @Mock
    private MembresiaRepository membresiaRepository;

    @InjectMocks
    private PermisoService permisoService;

    private final UUID usuarioId = UUID.randomUUID();
    private final UUID proyectoId = UUID.randomUUID();

    @BeforeEach
    void prepararUsuario() {
        when(usuarioActual.obtenerId()).thenReturn(usuarioId);
    }

    @Test
    void noMiembroRecibeAccesoDenegado() {
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId)).thenReturn(Optional.empty());
        assertThrows(AccessDeniedException.class, () -> permisoService.verificarMiembro(proyectoId));
    }

    @Test
    void miembroPuedeAcceder() {
        Membresia membresia = Membresia.builder().rol(Rol.FAMILIAR).build();

        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId)).thenReturn(Optional.of(membresia));
        assertDoesNotThrow(() -> permisoService.verificarMiembro(proyectoId));
    }

    @Test
    void tutorNoAdminRecibeAccesoDenegado() {
        Membresia membresia = Membresia.builder()
            .rol(Rol.TUTOR)
            .esAdmin(false)
            .build();

        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
            .thenReturn(Optional.of(membresia));

        assertThrows(AccessDeniedException.class,
            () -> permisoService.verificarAdmin(proyectoId));
    }

    @Test
    void familiarRecibeAccesoDenegadoComoAdmin() {
        Membresia membresia = Membresia.builder()
            .rol(Rol.FAMILIAR)
            .esAdmin(false)
            .build();

        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
            .thenReturn(Optional.of(membresia));

        assertThrows(AccessDeniedException.class,
            () -> permisoService.verificarAdmin(proyectoId));
    }

    @Test
    void tutorAdminPuedeAdministrar() {
        Membresia membresia = Membresia.builder()
            .rol(Rol.TUTOR)
            .esAdmin(true)
            .build();

        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
            .thenReturn(Optional.of(membresia));

        assertDoesNotThrow(() -> permisoService.verificarAdmin(proyectoId));
    }
    
    @Test
    void noAutorRecibeAccesoDenegado() {
        UUID otroAutorId = UUID.randomUUID();

        assertThrows(AccessDeniedException.class,
            () -> permisoService.verificarAutor(otroAutorId));
    }

    @Test
    void autorPuedeModificarSuAporte() {
        assertDoesNotThrow(() -> permisoService.verificarAutor(usuarioId));
    }

    @Test
    void aporteSinAutorRecibeAccesoDenegado() {
        assertThrows(AccessDeniedException.class,
            () -> permisoService.verificarAutor(null));
    }
}
