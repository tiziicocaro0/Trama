package com.trama.datosprueba;

import java.awt.Color;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.MembresiaEspecialidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.notificacion.PreferenciaNotificacion;
import com.trama.tpo.demo.entity.notificacion.TipoNotificacion;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.proyecto.TipoEscuela;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.entity.usuario.UsuarioEspecialidad;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.PreferenciaNotificacionRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioEspecialidadRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.AporteService;
import com.trama.tpo.demo.service.ArchivoService;
import com.trama.tpo.demo.service.ConfirmacionAporteService;

// Datos ficticios para ver la app con un perfil completo (estética, demos y videos).
// Vive en src/test: nunca entra en el jar ni en la imagen de Docker, así que la app
// hosteada no puede cargarlos. Solo corre con el perfil "datosprueba", que activa
// TramaConDatosDePrueba (datos-prueba.cmd o scripts/datos-prueba.sh) sobre la base trama_prueba.
// Está fuera del paquete com.trama.tpo.demo para que el escaneo de la app no lo encuentre.
//
// Un solo niño, Valen, con toda su red aportando (ver AportesDeValen).
@Component
@Profile("datosprueba")
public class CargadorDatosDePrueba implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CargadorDatosDePrueba.class);
    private static final String PASSWORD = "Trama1234!";
    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    private final UsuarioRepository usuarioRepository;
    private final ProyectoRepository proyectoRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioEspecialidadRepository usuarioEspecialidadRepository;
    private final PreferenciaNotificacionRepository preferenciaRepository;
    private final PasswordEncoder passwordEncoder;
    private final AporteService aporteService;
    private final ArchivoService archivoService;
    private final ConfirmacionAporteService confirmacionService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    // Para grabar un video con cuentas reales: en el .env (nunca en el repo) se pueden poner
    // DATOS_PRUEBA_EMAIL_TUTOR, DATOS_PRUEBA_EMAIL_DOCENTE y DATOS_PRUEBA_EMAIL_TERAPEUTA.
    // Reemplazan a Laura (tutora), María (docente) y Sofía (terapeuta). Si faltan, quedan los @trama.test.
    private final String emailTutor;
    private final String emailDocente;
    private final String emailTerapeuta;

    public CargadorDatosDePrueba(
            UsuarioRepository usuarioRepository,
            ProyectoRepository proyectoRepository,
            MembresiaRepository membresiaRepository,
            UsuarioEspecialidadRepository usuarioEspecialidadRepository,
            PreferenciaNotificacionRepository preferenciaRepository,
            PasswordEncoder passwordEncoder,
            AporteService aporteService,
            ArchivoService archivoService,
            ConfirmacionAporteService confirmacionService,
            JdbcTemplate jdbcTemplate,
            @Value("${DATOS_PRUEBA_EMAIL_TUTOR:}") String emailTutor,
            @Value("${DATOS_PRUEBA_EMAIL_DOCENTE:}") String emailDocente,
            @Value("${DATOS_PRUEBA_EMAIL_TERAPEUTA:}") String emailTerapeuta) {

        this.usuarioRepository = usuarioRepository;
        this.proyectoRepository = proyectoRepository;
        this.membresiaRepository = membresiaRepository;
        this.usuarioEspecialidadRepository = usuarioEspecialidadRepository;
        this.preferenciaRepository = preferenciaRepository;
        this.passwordEncoder = passwordEncoder;
        this.aporteService = aporteService;
        this.archivoService = archivoService;
        this.confirmacionService = confirmacionService;
        this.jdbcTemplate = jdbcTemplate;
        this.emailTutor = elegirEmail(emailTutor, "tutor@trama.test");
        this.emailDocente = elegirEmail(emailDocente, "docente@trama.test");
        this.emailTerapeuta = elegirEmail(emailTerapeuta, "terapeuta@trama.test");
    }

    private static String elegirEmail(String configurado, String porDefecto) {
        return configurado == null || configurado.isBlank() ? porDefecto : configurado.trim().toLowerCase();
    }

    @Override
    public void run(String... args) {

        // Si ya se cargaron los datos, no se vuelven a cargar
        if (usuarioRepository.existsByEmail("cotutor@trama.test")) {
            log.info("Datos de prueba: ya estaban cargados");
            return;
        }

        // La red de Valen, basada en nuestras user personas
        Usuario laura = crearUsuario("Laura", "Ruiz", emailTutor);
        Usuario pablo = crearUsuario("Pablo", "Gómez", "cotutor@trama.test");
        Usuario elena = crearUsuario("Elena", "Sosa", "familiar@trama.test");
        Usuario maria = crearUsuario("María", "Díaz", emailDocente);
        Usuario diego = crearUsuario("Diego", "Torres", "psico@trama.test");
        Usuario sofia = crearUsuario("Sofía", "Ramos", emailTerapeuta);

        // 9.4: cuentas profesionales con sus especialidades declaradas
        declararProfesional(maria, null, Especialidad.DOCENTE_PRIMARIO);
        declararProfesional(diego, "MN 12345", Especialidad.PSICOLOGIA);
        declararProfesional(sofia, "MN 67890", Especialidad.TERAPIA_OCUPACIONAL, Especialidad.ACOMPANANTE_TERAPEUTICO);

        // Las cuentas @trama.test no existen: no se les mandan mails (si no, Gmail devuelve rebotes)
        sinMailsParaCuentasFicticias();

        Proyecto valen = proyectoRepository.save(Proyecto.builder()
                .nombre("Valentina")
                .apellido("Ruiz")
                .apodo("Valen")
                .fechaNacimiento(LocalDate.of(2018, 9, 3))
                .escuela("Instituto San Martín")
                .grado("2.º grado")
                .tipoEscuela(TipoEscuela.HIBRIDA)
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(laura, valen, Rol.TUTOR, true, null, null);
        crearMembresia(pablo, valen, Rol.TUTOR, true, null, null);
        crearMembresia(elena, valen, Rol.FAMILIAR, false, null, null);
        crearMembresia(maria, valen, Rol.EDUCACION, false, Especialidad.DOCENTE_PRIMARIO, null);
        crearMembresia(diego, valen, Rol.SALUD, false, Especialidad.PSICOLOGIA, "MN 12345");
        crearMembresia(sofia, valen, Rol.SALUD, false, Especialidad.TERAPIA_OCUPACIONAL, "MN 67890");

        new AportesDeValen(this, valen.getId(), laura, pablo, elena, maria, diego, sofia).cargar();

        SecurityContextHolder.clearContext();
        log.info("Datos de prueba cargados. Contraseña de todos los usuarios: {}", PASSWORD);
    }

    // ------------------------------------------------------------------
    // Lo que usa AportesDeValen: todo se carga como si lo hiciera esa persona desde la app,
    // con los mismos services (y las mismas validaciones y permisos).
    // ------------------------------------------------------------------

    UUID aporte(Usuario autor, UUID proyectoId, int haceDias, TipoAporte tipo,
            String titulo, String contenido, String datos, Visibilidad visibilidad, UUID... archivos) {

        comoUsuario(autor);
        UUID creado = aporteService.crear(proyectoId,
                new AporteRequest(tipo, titulo, contenido, datos, visibilidad,
                        archivos.length == 0 ? null : List.of(archivos))).id();

        // Se fecha hace unos días, en horario de día, para que el perfil tenga historia.
        // Se corre la fecha que ya tiene (en vez de escribir una nueva) para no depender de la zona horaria.
        Instant fecha = LocalDate.now(ZONA)
                .minusDays(haceDias)
                .atTime(9 + haceDias * 7 % 11, haceDias * 13 % 60)
                .atZone(ZONA)
                .toInstant();
        long minutos = Duration.between(fecha, Instant.now()).toMinutes();
        // MySQL asigna de izquierda a derecha: actualizado_en toma la creado_en ya corrida
        jdbcTemplate.update("UPDATE aporte SET creado_en = DATE_SUB(creado_en, INTERVAL ? MINUTE), "
                + "actualizado_en = creado_en WHERE id = ?", minutos, bytes(creado));
        return creado;
    }

    void confirmar(Usuario usuario, UUID aporteId) {
        byte[] proyecto = jdbcTemplate.queryForObject(
                "SELECT proyecto_id FROM aporte WHERE id = ?", byte[].class, bytes(aporteId));
        ByteBuffer buffer = ByteBuffer.wrap(proyecto);
        comoUsuario(usuario);
        confirmacionService.confirmar(new UUID(buffer.getLong(), buffer.getLong()), aporteId);
    }

    // Con visibilidad es un recurso suelto (pestaña Recursos); sin ella, un adjunto para un aporte
    UUID imagen(Usuario autor, UUID proyectoId, String nombre, String titulo, String[] pasos,
            Color color, Visibilidad visibilidad) {
        return subir(autor, proyectoId, new MockMultipartFile("archivo", nombre, "image/png",
                ArchivosDePrueba.pictograma(titulo, pasos, color)), visibilidad);
    }

    UUID pdf(Usuario autor, UUID proyectoId, String nombre, String titulo, String texto, Visibilidad visibilidad) {
        return subir(autor, proyectoId, new MockMultipartFile("archivo", nombre, "application/pdf",
                ArchivosDePrueba.pdf(titulo, texto)), visibilidad);
    }

    // JSON de "datos" a partir de pares clave, valor (en orden)
    String datos(Object... claveValor) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        for (int i = 0; i < claveValor.length; i += 2) {
            mapa.put((String) claveValor[i], claveValor[i + 1]);
        }
        try {
            return mapper.writeValueAsString(mapa);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    // ------------------------------------------------------------------

    private UUID subir(Usuario autor, UUID proyectoId, MockMultipartFile archivo, Visibilidad visibilidad) {
        comoUsuario(autor);
        return archivoService.subir(proyectoId, archivo, visibilidad).id();
    }

    private void comoUsuario(Usuario usuario) {
        User principal = new User(usuario.getId().toString(), "", List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    private void sinMailsParaCuentasFicticias() {
        for (Usuario usuario : usuarioRepository.findAll()) {
            if (!usuario.getEmail().endsWith("@trama.test")) {
                continue;
            }
            for (TipoNotificacion tipo : TipoNotificacion.values()) {
                if (tipo.isConfigurable()) {
                    preferenciaRepository.save(PreferenciaNotificacion.builder()
                            .usuarioId(usuario.getId())
                            .tipo(tipo)
                            .porEmail(false)
                            .build());
                }
            }
        }
    }

    private static byte[] bytes(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits())
                .putLong(id.getLeastSignificantBits())
                .array();
    }

    private Usuario crearUsuario(String nombre, String apellido, String email) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido(apellido)
                .email(email)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .build());
    }

    private void declararProfesional(Usuario usuario, String matricula, Especialidad... especialidades) {
        usuario.setTipoCuenta(TipoCuenta.PROFESIONAL);
        usuario.setMatricula(matricula);
        usuarioRepository.save(usuario);
        for (Especialidad especialidad : especialidades) {
            usuarioEspecialidadRepository.save(UsuarioEspecialidad.builder()
                    .usuarioId(usuario.getId())
                    .especialidad(especialidad)
                    .build());
        }
    }

    private void crearMembresia(Usuario usuario, Proyecto proyecto, Rol rol, boolean esAdmin,
            Especialidad especialidad, String matricula) {
        Membresia membresia = membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(esAdmin)
                .matricula(matricula)
                .build());
        // Si tiene especialidad, agregar a la tabla de especialidades
        if (especialidad != null) {
            membresia.getEspecialidades().add(MembresiaEspecialidad.builder()
                    .membresia(membresia)
                    .especialidad(especialidad)
                    .build());
            membresiaRepository.save(membresia);
        }
    }
}
