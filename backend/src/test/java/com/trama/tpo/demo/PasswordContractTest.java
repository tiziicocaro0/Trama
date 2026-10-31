package com.trama.tpo.demo;

import com.trama.tpo.demo.config.ApplicationConfig;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.dto.AuthenticationRequest;
import com.trama.tpo.demo.entity.dto.RegisterRequest;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.repository.UsuarioEspecialidadRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.AuthenticationService;
import com.trama.tpo.demo.service.LoginAttemptService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.BadCredentialsException;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class PasswordContractTest {
    @ParameterizedTest
    @ValueSource(strings = {"Prueba123!", "  Prueba123!  ", "ClavéÑ9! + símbolo€"})
    void registroYLoginPreservanPasswordYUsanElMismoEncoder(String password) {
        UsuarioRepository repository = mock(UsuarioRepository.class);
        ApplicationConfig config = new ApplicationConfig(repository);
        var encoder = config.passwordEncoder();
        var manager = new ProviderManager(config.authenticationProvider(config.userDetailsService(), encoder));
        JwtService jwt = mock(JwtService.class);
        LoginAttemptService intentos = mock(LoginAttemptService.class);
        AuthenticationService service = new AuthenticationService(repository,
                mock(UsuarioEspecialidadRepository.class), encoder, jwt, manager, intentos);
        AtomicReference<Usuario> guardado = new AtomicReference<>();
        UUID id = UUID.randomUUID();
        when(repository.save(any(Usuario.class))).thenAnswer(invocacion -> {
            Usuario usuario = invocacion.getArgument(0);
            usuario.setId(id);
            guardado.set(usuario);
            return usuario;
        });
        when(repository.findByEmail("password@trama.test")).thenAnswer(invocacion -> Optional.ofNullable(guardado.get()));
        when(repository.findById(id)).thenAnswer(invocacion -> Optional.ofNullable(guardado.get()));
        when(jwt.generateToken(id)).thenReturn("jwt-ficticio");

        service.register(RegisterRequest.builder().tipoCuenta(TipoCuenta.FAMILIA).nombre("Nora").apellido("Prueba")
                .email("PASSWORD@trama.test").password(password).build());

        assertTrue(encoder.matches(password, guardado.get().getPasswordHash()), "El hash debe coincidir sin transformar la contraseña");
        assertNotEquals(password, guardado.get().getPasswordHash());
        var respuesta = service.authenticate(AuthenticationRequest.builder()
                .email("password@trama.test").password(password).build());
        assertEquals(id, respuesta.getId());
        verify(intentos).reiniciarIntentos(id);

        assertThrows(BadCredentialsException.class, () -> service.authenticate(AuthenticationRequest.builder()
                .email("password@trama.test").password("Distinta9!").build()));
        verify(intentos).registrarIntentoFallido(id);
    }
}
