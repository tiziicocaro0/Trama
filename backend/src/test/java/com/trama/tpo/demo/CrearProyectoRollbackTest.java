package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import com.trama.tpo.demo.entity.dto.CrearProyectoRequest;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.ProyectoService;
import com.trama.tpo.demo.service.UsuarioActual;

@SpringBootTest
@ActiveProfiles("test")
class CrearProyectoRollbackTest {
    @Autowired ProyectoService service;
    @Autowired ProyectoRepository proyectos;
    @Autowired UsuarioRepository usuarios;
    @MockBean MembresiaRepository membresias;
    @MockBean UsuarioActual usuarioActual;

    @Test
    void noDejaUnProyectoHuerfanoSiFallaLaMembresia() {
        Usuario usuario = usuarios.save(Usuario.builder().nombre("Tutora ficticia")
                .apellido("Ejemplo").email(UUID.randomUUID() + "@trama.test")
                .passwordHash("no-se-utiliza-en-este-test").build());
        try {
            when(usuarioActual.obtenerId()).thenReturn(usuario.getId());
            doThrow(new IllegalStateException("Falla simulada de membresía"))
                    .when(membresias).save(any());
            long cantidad = proyectos.count();
            var solicitud = new CrearProyectoRequest("Niño ficticio", "Ejemplo", null,
                    LocalDate.of(2018, 5, 12), "Escuela ficticia", "2.º", true);

            assertThatThrownBy(() -> service.crear(solicitud)).isInstanceOf(IllegalStateException.class);
            assertThat(proyectos.count()).isEqualTo(cantidad);
        } finally {
            usuarios.deleteById(usuario.getId());
        }
    }
}
