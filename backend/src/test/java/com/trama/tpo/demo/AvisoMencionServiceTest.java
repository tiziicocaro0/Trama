package com.trama.tpo.demo;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.service.AvisoMencionService;
import com.trama.tpo.demo.service.NotificacionService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AvisoMencionServiceTest {

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private NotificacionService notificacionService;

    @InjectMocks
    private AvisoMencionService avisoMencionService;

    private UUID proyectoId;
    private Proyecto proyecto;
    private Aporte aporte;

    @BeforeEach
    void prepararDatos() {
        proyectoId = UUID.randomUUID();

        proyecto = Proyecto.builder()
                .id(proyectoId)
                .familiarVeNotas(false)
                .build();

        aporte = Aporte.builder()
                .proyecto(proyecto)
                .tipo(TipoAporte.FORTALEZA)
                .visibilidad(Visibilidad.TODOS)
                .build();
    }

    // Una mención repetida genera un solo aviso.
    // El autor del comentario no recibe avisos propios.
    @Test
    void notificaUnaVezYExcluyeAlAutorDelComentario() {
        Usuario maria = usuario("María", "Pérez");
        Usuario lucia = usuario("Lucía", "Gómez");

        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(
                        miembro(maria, Rol.EDUCACION),
                        miembro(lucia, Rol.TUTOR)
                ));

        avisoMencionService.notificarMenciones(
                aporte,
                lucia.getId(),
                "@María Pérez, revisá esto. Gracias @Maria Perez y @Lucía."
        );

        verificarNotificacion(maria.getId());
    }

    // Un familiar sin acceso a notas profesionales
    // no debe recibir menciones sobre esas notas.
    @Test
    void respetaLosPermisosDeVisibilidad() {
        Usuario familiar = usuario("Laura", "Soto");
        Usuario profesional = usuario("Pablo", "Díaz");

        aporte.setTipo(TipoAporte.NOTA_PROFESIONAL);

        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(
                        miembro(familiar, Rol.FAMILIAR),
                        miembro(profesional, Rol.SALUD)
                ));

        avisoMencionService.notificarMenciones(
                aporte,
                UUID.randomUUID(),
                "@Laura Soto y @Pablo Díaz, revisen la nota."
        );

        // Solo el profesional puede recibir el aviso.
        verificarNotificacion(profesional.getId());
    }

    // Si dos personas tienen el mismo nombre,
    // no debe elegirse una al azar.
    @Test
    void noNotificaNombresAmbiguos() {
        Usuario mariaPerez = usuario("María", "Pérez");
        Usuario mariaGomez = usuario("María", "Gómez");

        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(
                        miembro(mariaPerez, Rol.TUTOR),
                        miembro(mariaGomez, Rol.EDUCACION)
                ));

        avisoMencionService.notificarMenciones(
                aporte,
                UUID.randomUUID(),
                "@María, ¿podés revisar esto?"
        );

        verifyNoInteractions(notificacionService);

        // Con el nombre completo sí se identifica.
        avisoMencionService.notificarMenciones(
                aporte,
                UUID.randomUUID(),
                "@María Gómez, ¿podés revisar esto?"
        );

        verificarNotificacion(mariaGomez.getId());
    }

    // El autor del aporte sí puede recibir una mención
    // cuando otra persona escribe el comentario.
    @Test
    void puedeNotificarAlAutorDelAporte() {
        Usuario maria = usuario("María", "Pérez");
        Usuario lucia = usuario("Lucía", "Gómez");

        aporte.setAutor(maria);

        when(membresiaRepository.findByProyectoId(proyectoId))
                .thenReturn(List.of(
                        miembro(maria, Rol.TUTOR),
                        miembro(lucia, Rol.EDUCACION)
                ));

        avisoMencionService.notificarMenciones(
                aporte,
                lucia.getId(),
                "@María Pérez, ¿qué opinás?"
        );

        verificarNotificacion(maria.getId());
    }

    // ---------- Métodos auxiliares ----------

    private Usuario usuario(String nombre, String apellido) {
        return Usuario.builder()
                .id(UUID.randomUUID())
                .nombre(nombre)
                .apellido(apellido)
                .build();
    }

    private Membresia miembro(Usuario usuario, Rol rol) {
        return Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .build();
    }

    private void verificarNotificacion(UUID destinatarioId) {
        verify(notificacionService).notificar(
                eq(List.of(destinatarioId)),
                eq(proyectoId),
                eq("MENCION"),
                eq("Te mencionaron en un comentario."),
                eq("/proyectos/" + proyectoId)
        );
    }
}
