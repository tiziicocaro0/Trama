package com.trama.tpo.demo.service;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trama.tpo.demo.entity.dto.InvitacionDetalleResponse;
import com.trama.tpo.demo.entity.dto.InvitacionRequest;
import com.trama.tpo.demo.entity.dto.InvitacionResponse;
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

@Service
public class InvitacionService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final InvitacionRepository invitacionRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final EmailService emailService;
    private final String urlBaseInvitacion;

    public InvitacionService(
            InvitacionRepository invitacionRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            EmailService emailService,
            @Value("${trama.invitaciones.url-base:}") String urlBaseInvitacion) {

        this.invitacionRepository = invitacionRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.emailService = emailService;
        this.urlBaseInvitacion = urlBaseInvitacion;
    }

    // 1.4 - Consultar una invitacion mediante su token.
    @Transactional(readOnly = true)
    public InvitacionDetalleResponse consultarInvitacion(String token) {

        // 1. Calcular el hash del token recibido.
        String tokenHash = calcularHash(token);

        // 2. Buscar la invitacion en la base de datos.
        Invitacion invitacion = invitacionRepository
                .findByTokenHash(tokenHash)
                .orElseThrow(() -> new ApiException(
                        "INVITACION_NO_ENCONTRADA",
                        "No encontramos esta invitacion",
                        HttpStatus.NOT_FOUND
                ));

        // 3. Comprobar que siga pendiente y no haya vencido.
        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE
                || !invitacion.getVenceEn().isAfter(Instant.now())) {

            throw new ApiException(
                    "INVITACION_NO_DISPONIBLE",
                    "La invitacion vencio o ya fue utilizada",
                    HttpStatus.GONE
            );
        }

        // 4. Devolver solamente los datos publicos.
        return InvitacionDetalleResponse.from(invitacion);
    }

    // Aceptar una invitacion y crear la membresia.
    // La especialidad se configura despues con PUT /miembros/me/especialidades.
    @Transactional
    public MiembroResponse aceptarInvitacion(String token) {

        // 1. Buscar la invitacion bloqueando su registro.
        String tokenHash = calcularHash(token);

        Invitacion invitacion = invitacionRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() -> new ApiException(
                        "INVITACION_NO_ENCONTRADA",
                        "No encontramos esta invitacion",
                        HttpStatus.NOT_FOUND
                ));

        // 2. Comprobar que siga pendiente y vigente.
        if (invitacion.getEstado() != EstadoInvitacion.PENDIENTE
                || !invitacion.getVenceEn().isAfter(Instant.now())) {

            throw new ApiException(
                    "INVITACION_NO_DISPONIBLE",
                    "La invitacion vencio o ya fue utilizada",
                    HttpStatus.GONE
            );
        }

        // 3. Obtener al usuario autenticado.
        UUID usuarioId = usuarioActual.obtenerId();

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "No encontramos al usuario autenticado",
                        HttpStatus.UNAUTHORIZED
                ));

        // 4. Verificar que sea el destinatario de la invitacion.
        String emailUsuario = usuario.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (!invitacion.getEmail().equalsIgnoreCase(emailUsuario)) {
            throw new ApiException(
                    "DESTINATARIO_INCORRECTO",
                    "Esta invitacion pertenece a otra cuenta",
                    HttpStatus.FORBIDDEN
            );
        }

        // 5. Evitar crear una membresia duplicada.
        if (membresiaRepository.existsByUsuarioIdAndProyectoId(
                usuarioId,
                invitacion.getProyecto().getId())) {

            throw new ApiException(
                    "YA_ES_MIEMBRO",
                    "Ya perteneces a este proyecto",
                    HttpStatus.CONFLICT
            );
        }

        // 6. Crear la membresia con el rol indicado en la invitacion.
        // 1.6: Si la invitacion es para rol TUTOR (co-tutor), queda con esAdmin = true.
        Membresia membresia = Membresia.builder()
                .usuario(usuario)
                .proyecto(invitacion.getProyecto())
                .rol(invitacion.getRol())
                .esAdmin(invitacion.getRol() == Rol.TUTOR)
                .build();

        membresia = membresiaRepository.saveAndFlush(membresia);

        // 7. Marcar la invitacion como utilizada.
        invitacion.setEstado(EstadoInvitacion.ACEPTADA);
        invitacionRepository.saveAndFlush(invitacion);

        // 8. Devolver los datos de la nueva membresia.
        return MiembroResponse.from(membresia);
    }

    @Transactional
    public InvitacionResponse crearInvitacion(
            UUID proyectoId,
            InvitacionRequest request) {

        // 1. Solo un tutor administrador puede invitar miembros.
        permisoService.verificarAdmin(proyectoId);

        // 2. Validar el rol solicitado (incluye TUTOR para co-tutor en 1.6).
        Rol rol = request.getRol();

        if (rol == null) {
            throw new ApiException(
                    "ROL_INVALIDO",
                    "El rol es obligatorio",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Normalizar el email.
        String email = request.getEmail()
                .trim()
                .toLowerCase(Locale.ROOT);

        // 3. Comprobar que el proyecto existe.
        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO",
                        "No encontramos este proyecto",
                        HttpStatus.NOT_FOUND
                ));

        // 4. Obtener al usuario autenticado.
        UUID usuarioId = usuarioActual.obtenerId();

        Usuario invitadoPor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "No encontramos al usuario autenticado",
                        HttpStatus.UNAUTHORIZED
                ));

        // 5. Evitar invitar a alguien que ya pertenece al proyecto.
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {

            if (membresiaRepository.existsByUsuarioIdAndProyectoId(
                    usuario.getId(), proyectoId)) {

                throw new ApiException(
                        "YA_ES_MIEMBRO",
                        "Esta persona ya pertenece al proyecto",
                        HttpStatus.CONFLICT
                );
            }
        });

        // 6. Evitar duplicar una invitacion pendiente y vigente.
        Instant ahora = Instant.now();

        boolean yaInvitado = invitacionRepository
                .findByProyectoIdAndEstado(
                        proyectoId,
                        EstadoInvitacion.PENDIENTE
                )
                .stream()
                .anyMatch(invitacion ->
                        invitacion.getEmail().equalsIgnoreCase(email)
                        && invitacion.getVenceEn().isAfter(ahora)
                );

        if (yaInvitado) {
            throw new ApiException(
                    "INVITACION_EXISTENTE",
                    "Ya existe una invitacion pendiente para este email",
                    HttpStatus.CONFLICT
            );
        }

        // 7. Generar un token aleatorio seguro.
        String token = generarToken();

        // En la base de datos guardamos solo su SHA-256.
        String tokenHash = calcularHash(token);

        // 8. Generar el enlace y establecer el vencimiento.
        String enlace = construirEnlace(token);

        Instant vencimiento = ahora.plus(7, ChronoUnit.DAYS);

        // 9. Crear y guardar la invitacion.
        Invitacion invitacion = Invitacion.builder()
                .proyecto(proyecto)
                .invitadoPor(invitadoPor)
                .email(email)
                .rol(rol)
                .tokenHash(tokenHash)
                .venceEn(vencimiento)
                .estado(EstadoInvitacion.PENDIENTE)
                .build();

        invitacion = invitacionRepository.saveAndFlush(invitacion);

        // 10. Enviar el enlace por correo.
        // Evitamos incluir datos personales del niño en el email.
        emailService.enviarInvitacion(
                email,
                "compartido",
                enlace
        );

        return InvitacionResponse.from(invitacion);
    }

    // Genera 32 bytes aleatorios y los convierte en un token URL-safe.
    private String generarToken() {

        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    // Calcula el SHA-256 del token original.
    private String calcularHash(String token) {

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(
                    "No se pudo generar el hash de la invitacion",
                    e
            );
        }
    }

    // La URL de aceptacion se configura segun el entorno.
    private String construirEnlace(String token) {

        if (urlBaseInvitacion == null || urlBaseInvitacion.isBlank()) {
            throw new IllegalStateException(
                    "Falta configurar trama.invitaciones.url-base"
            );
        }

        String base = urlBaseInvitacion.trim();
        URI uri = URI.create(base);

        if (!uri.isAbsolute()
                || (!"http".equalsIgnoreCase(uri.getScheme())
                && !"https".equalsIgnoreCase(uri.getScheme()))
                || uri.getHost() == null
                || uri.getRawQuery() != null
                || uri.getRawFragment() != null) {

            throw new IllegalStateException(
                    "La URL base de invitaciones debe ser una direccion HTTP(S) valida, sin query ni fragmento"
            );
        }

        return base.replaceAll("/+$", "") + "/" + token;
    }
}
