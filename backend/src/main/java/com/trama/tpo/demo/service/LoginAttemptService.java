package com.trama.tpo.demo.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.UsuarioRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final UsuarioRepository repository;

    // Registrar un intento fallido
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarIntentoFallido(UUID usuarioId) {

        // Bloquear la fila mientras actualizamos el contador
        Usuario usuario = repository.findByIdForUpdate(usuarioId)
                .orElseThrow();

        Instant ahora = Instant.now();

        // Si el bloqueo anterior venció, empezar un nuevo conteo
        if (usuario.getBloqueadoHasta() != null
                && !usuario.getBloqueadoHasta().isAfter(ahora)) {

            usuario.setIntentosFallidos(0);
            usuario.setBloqueadoHasta(null);
        }

        int intentos = usuario.getIntentosFallidos() + 1;

        usuario.setIntentosFallidos(intentos);

        // Bloquear después de cinco intentos fallidos
        if (intentos >= 5) {
            usuario.setBloqueadoHasta(
                    ahora.plus(15, ChronoUnit.MINUTES)
            );
        }

        repository.save(usuario);
    }

    // Reiniciar contador después de un login exitoso
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reiniciarIntentos(UUID usuarioId) {

        // Bloquear la fila mientras reiniciamos el contador
        Usuario usuario = repository.findByIdForUpdate(usuarioId)
                .orElseThrow();

        usuario.setIntentosFallidos(0);
        usuario.setBloqueadoHasta(null);

        repository.save(usuario);
    }
}