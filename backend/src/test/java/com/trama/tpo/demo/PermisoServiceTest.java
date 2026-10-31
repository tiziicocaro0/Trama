package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;

import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.exceptions.SoloLecturaException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.MiembroService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.PlanService;
import com.trama.tpo.demo.service.RegistroAccionService;
import com.trama.tpo.demo.service.ProyectoService;
import com.trama.tpo.demo.service.UsuarioActual;

@ExtendWith(MockitoExtension.class)
class PermisoServiceTest {

    @Mock
    private UsuarioActual usuarioActual;

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private ProyectoRepository proyectoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PlanService planService;

    @InjectMocks
    private PermisoService permisoService;

    private ProyectoService proyectoService;

    private MiembroService miembroService;

    private final UUID usuarioId = UUID.randomUUID();
    private final UUID proyectoId = UUID.randomUUID();

    @BeforeEach
    void prepararUsuario() {
        when(usuarioActual.obtenerId()).thenReturn(usuarioId);
        proyectoService = new ProyectoService(
                proyectoRepository,
                permisoService,
                usuarioActual,
                membresiaRepository,
                usuarioRepository,
                mock(RegistroAccionService.class));
        miembroService = new MiembroService(
                membresiaRepository,
                permisoService,
                usuarioActual,
                mock(RegistroAccionService.class));
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

    // 1.5: Si el usuario no es admin, quitarMiembro lanza AccessDeniedException (403)
    @Test
    void quitarMiembroSinSerAdminLanza403() {
        UUID miembroId = UUID.randomUUID();
        Membresia noAdmin = Membresia.builder()
                .rol(Rol.EDUCACION)
                .esAdmin(false)
                .build();

        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(noAdmin));

        assertThrows(AccessDeniedException.class,
                () -> miembroService.quitarMiembro(proyectoId, miembroId));
    }

    // 1.5: Si se intenta eliminar al único admin del proyecto, lanza ApiException 400
    @Test
    void quitarUnicoAdminLanza400() {
        UUID miembroAdminId = UUID.randomUUID();
        Membresia unicoAdmin = Membresia.builder()
                .id(miembroAdminId)
                .rol(Rol.TUTOR)
                .esAdmin(true)
                .build();

        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(unicoAdmin));
        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(unicoAdmin));

        ApiException ex = assertThrows(ApiException.class,
                () -> miembroService.quitarMiembro(proyectoId, miembroAdminId));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getEstado());
        assertEquals("ULTIMO_ADMIN", ex.getCodigo());
    }

    // 1.5: Revocar OK y en la siguiente consulta el usuario revocado no puede entrar al proyecto (403)
    @Test
    void quitarMiembroRevocaAccesoYRevocadoNoPuedeEntrarAlProyecto() {
        UUID miembroAdminId = UUID.randomUUID();
        UUID miembroDocenteId = UUID.randomUUID();
        UUID usuarioDocenteId = UUID.randomUUID();

        Membresia admin = Membresia.builder()
                .id(miembroAdminId)
                .rol(Rol.TUTOR)
                .esAdmin(true)
                .build();
        Membresia docente = Membresia.builder()
                .id(miembroDocenteId)
                .rol(Rol.EDUCACION)
                .esAdmin(false)
                .build();

        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(admin));
        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(admin, docente));

        assertDoesNotThrow(() -> miembroService.quitarMiembro(proyectoId, miembroDocenteId));
        verify(membresiaRepository).delete(docente);

        // Siguiente request del usuario revocado -> 403 Forbidden
        when(usuarioActual.obtenerId()).thenReturn(usuarioDocenteId);
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioDocenteId, proyectoId))
                .thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> proyectoService.obtener(proyectoId));
    }

    @Test
    void saludNoPuedeVerAporteSoloEducacion() {
        Membresia salud = Membresia.builder().rol(Rol.SALUD).build();
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(salud));

        assertDoesNotThrow(() -> permisoService.verificarPuedeVerAporte(proyectoId, Visibilidad.SOLO_SALUD));
        assertThrows(AccessDeniedException.class,
                () -> permisoService.verificarPuedeVerAporte(proyectoId, Visibilidad.SOLO_EDUCACION));
    }

    @Test
    void familiarSoloVeAportesParaTodos() {
        Membresia familiar = Membresia.builder().rol(Rol.FAMILIAR).build();
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(familiar));

        assertDoesNotThrow(() -> permisoService.verificarPuedeVerAporte(proyectoId, Visibilidad.TODOS));
        assertThrows(AccessDeniedException.class,
                () -> permisoService.verificarPuedeVerAporte(proyectoId, Visibilidad.SOLO_TUTORES));
    }

    // 4.2: notas profesionales (aporte de Tiziana en el #48, adaptado al método de develop)

    @Test
    void familiarNoPuedeCargarNotasAunqueTengaPermisoDeEdicion() {
        Membresia familiar = Membresia.builder()
                .rol(Rol.FAMILIAR)
                .proyecto(Proyecto.builder().id(proyectoId).familiarPuedeCargar(true).build())
                .build();
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(familiar));

        assertThrows(AccessDeniedException.class,
                () -> permisoService.verificarPuedeCargarNotas(proyectoId));
    }

    @Test
    void tutorNoPuedeCargarNotas() {
        Membresia tutor = Membresia.builder().rol(Rol.TUTOR).build();
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(tutor));

        assertThrows(AccessDeniedException.class,
                () -> permisoService.verificarPuedeCargarNotas(proyectoId));
    }

    @Test
    void profesionalDeSaludPuedeCargarNotasEnUnProyectoGratuito() {
        Membresia salud = Membresia.builder()
                .rol(Rol.SALUD)
                .proyecto(Proyecto.builder().id(proyectoId).build())
                .build();
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(salud));
        when(membresiaRepository.findByUsuarioIdAndRolInOrderByFechaAltaAscIdAsc(
                eq(usuarioId), anySet()))
                .thenReturn(List.of(salud));

        assertDoesNotThrow(() -> permisoService.verificarPuedeCargarNotas(proyectoId));
    }

    // 9.0: límite freemium del profesional

    @Test
    void profesionalGratuitoRecibeSoloLecturaEnSuTercerProyecto() {
        Membresia tercera = membresiaProfesional(proyectoId);
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(tercera));
        when(membresiaRepository.findByUsuarioIdAndRolInOrderByFechaAltaAscIdAsc(eq(usuarioId), anySet()))
                .thenReturn(List.of(membresiaProfesional(UUID.randomUUID()),
                        membresiaProfesional(UUID.randomUUID()), tercera));

        assertThrows(SoloLecturaException.class, () -> permisoService.verificarPuedeEditar(proyectoId));
        assertEquals(true, permisoService.soloLecturaPorPlan(proyectoId));
    }

    @Test
    void profesionalConPlanPagoEditaEnTodosSusProyectos() {
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(membresiaProfesional(proyectoId)));
        when(planService.editaSinLimite(usuarioId)).thenReturn(true);

        assertDoesNotThrow(() -> permisoService.verificarPuedeEditar(proyectoId));
        assertEquals(false, permisoService.soloLecturaPorPlan(proyectoId));
    }

    @Test
    void unFamiliarSinPermisoNoQuedaEnSoloLecturaPorPlan() {
        Membresia familiar = Membresia.builder()
                .rol(Rol.FAMILIAR)
                .proyecto(Proyecto.builder().id(proyectoId).familiarPuedeCargar(false).build())
                .build();
        when(membresiaRepository.findByUsuarioIdAndProyectoId(usuarioId, proyectoId))
                .thenReturn(Optional.of(familiar));

        assertEquals(false, permisoService.soloLecturaPorPlan(proyectoId));
    }

    private Membresia membresiaProfesional(UUID idProyecto) {
        return Membresia.builder()
                .rol(Rol.EDUCACION)
                .proyecto(Proyecto.builder().id(idProyecto).build())
                .build();
    }
}
