package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;

import com.trama.tpo.demo.entity.dto.CrearProyectoRequest;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.ProyectoService;
import com.trama.tpo.demo.service.UsuarioActual;

@ExtendWith(MockitoExtension.class)
class CrearProyectoServiceTest {
    @Mock ProyectoRepository proyectos;
    @Mock MembresiaRepository membresias;
    @Mock UsuarioRepository usuarios;
    @Mock PermisoService permisos;
    @Mock UsuarioActual usuarioActual;
    @InjectMocks ProyectoService service;

    private CrearProyectoRequest solicitud(Boolean consentimiento) {
        return new CrearProyectoRequest(" Luz ", " Ejemplo ", " ", LocalDate.of(2018, 5, 12),
                " Escuela ficticia ", " 2.º ", consentimiento);
    }

    @Test
    void creaProyectoConValoresPorDefectoYMembresiaDelUsuarioAutenticado() {
        UUID usuarioId = UUID.randomUUID();
        Usuario usuario = Usuario.builder().id(usuarioId).build();
        when(permisos.verificarPuedeCrearProyecto()).thenReturn(usuarioId);
        when(usuarios.findById(usuarioId)).thenReturn(Optional.of(usuario));
        when(proyectos.save(any())).thenAnswer(invocacion -> {
            Proyecto proyecto = invocacion.getArgument(0);
            proyecto.setId(UUID.randomUUID());
            return proyecto;
        });

        var respuesta = service.crear(solicitud(true));

        ArgumentCaptor<Membresia> captor = ArgumentCaptor.forClass(Membresia.class);
        verify(membresias).save(captor.capture());
        Membresia membresia = captor.getValue();
        assertThat(membresia.getUsuario()).isSameAs(usuario);
        assertThat(membresia.getProyecto().getId()).isEqualTo(respuesta.id());
        assertThat(membresia.getRol()).isEqualTo(Rol.TUTOR);
        assertThat(membresia.getEsAdmin()).isTrue();
        assertThat(membresia.getProyecto().getConsentimientoFecha()).isNotNull();
        assertThat(respuesta.nombre()).isEqualTo("Luz");
        assertThat(respuesta.apodo()).isNull();
        assertThat(respuesta.familiarPuedeCargar()).isTrue();
        assertThat(respuesta.familiarVeNotas()).isFalse();
        var orden = inOrder(permisos, usuarios, proyectos, membresias);
        orden.verify(permisos).verificarPuedeCrearProyecto();
        orden.verify(usuarios).findById(usuarioId);
        orden.verify(proyectos).save(any());
        orden.verify(membresias).save(any());
    }

    @Test
    void noGuardaSinConsentimiento() {
        when(permisos.verificarPuedeCrearProyecto()).thenReturn(UUID.randomUUID());
        assertThatThrownBy(() -> service.crear(solicitud(false))).isInstanceOf(ApiException.class);
        verifyNoInteractions(proyectos, membresias, usuarios);
    }

    @Test
    void noGuardaSiElUsuarioNoExiste() {
        UUID id = UUID.randomUUID();
        when(permisos.verificarPuedeCrearProyecto()).thenReturn(id);
        when(usuarios.findById(id)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.crear(solicitud(true))).isInstanceOf(ApiException.class);
        verifyNoInteractions(proyectos, membresias);
    }

    @Test
    void noLeeNiGuardaSinAutenticacion() {
        when(permisos.verificarPuedeCrearProyecto()).thenThrow(new AuthenticationCredentialsNotFoundException("Sin sesión"));
        assertThatThrownBy(() -> service.crear(solicitud(true))).isInstanceOf(AuthenticationCredentialsNotFoundException.class);
        verifyNoInteractions(proyectos, membresias, usuarios);
    }
}
