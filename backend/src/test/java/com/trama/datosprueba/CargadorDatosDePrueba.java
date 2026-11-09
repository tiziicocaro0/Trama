package com.trama.datosprueba;

import java.nio.ByteBuffer;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.AporteResponse;

import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.MembresiaEspecialidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.proyecto.TipoEscuela;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.entity.usuario.UsuarioEspecialidad;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioEspecialidadRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.AporteService;

// Datos ficticios para ver y probar la app en una PC de desarrollo.
// Vive en src/test: nunca entra en el jar ni en la imagen de Docker, así que la app
// hosteada no puede cargarlos. Solo corre con el perfil "datosprueba", que activa
// TramaConDatosDePrueba (scripts/datos-prueba.ps1 o .sh) sobre la base trama_prueba.
// Está fuera del paquete com.trama.tpo.demo para que el escaneo de la app no lo encuentre.
@Component
@Profile("datosprueba")
public class CargadorDatosDePrueba implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CargadorDatosDePrueba.class);
    private static final String PASSWORD = "Trama1234!";

    private final UsuarioRepository usuarioRepository;
    private final ProyectoRepository proyectoRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioEspecialidadRepository usuarioEspecialidadRepository;
    private final PasswordEncoder passwordEncoder;
    private final AporteService aporteService;
    private final JdbcTemplate jdbcTemplate;

    public CargadorDatosDePrueba(
            UsuarioRepository usuarioRepository,
            ProyectoRepository proyectoRepository,
            MembresiaRepository membresiaRepository,
            UsuarioEspecialidadRepository usuarioEspecialidadRepository,
            PasswordEncoder passwordEncoder,
            AporteService aporteService,
            JdbcTemplate jdbcTemplate) {

        this.usuarioRepository = usuarioRepository;
        this.proyectoRepository = proyectoRepository;
        this.membresiaRepository = membresiaRepository;
        this.usuarioEspecialidadRepository = usuarioEspecialidadRepository;
        this.passwordEncoder = passwordEncoder;
        this.aporteService = aporteService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {

        // Si ya se cargaron los datos, no se vuelven a cargar
        if (usuarioRepository.existsByEmail("tutor@trama.test")) {
            log.info("Datos de prueba: ya estaban cargados");
            return;
        }

        // Usuarios basados en nuestras user personas
        Usuario tutor = crearUsuario("Marta", "Fernández", "tutor@trama.test");
        Usuario cotutor = crearUsuario("Jorge", "Fernández", "cotutor@trama.test");
        Usuario familiar = crearUsuario("Elena", "Sosa", "familiar@trama.test");
        Usuario docente = crearUsuario("María", "Díaz", "docente@trama.test");
        Usuario psico = crearUsuario("Diego", "Torres", "psico@trama.test");
        Usuario tutoraValen = crearUsuario("Laura", "Ruiz", "tutora.valen@trama.test");
        Usuario tutorJuli = crearUsuario("Pablo", "Gómez", "tutor.juli@trama.test");

        // 9.4: cuentas profesionales con sus especialidades declaradas.
        // terapeuta@ todavía no está en ningún niño: sirve para probar invitaciones.
        declararProfesional(docente, Especialidad.DOCENTE_PRIMARIO);
        declararProfesional(psico, Especialidad.PSICOLOGIA);
        psico.setMatricula("MN 12345");
        usuarioRepository.save(psico);
        declararProfesional(crearUsuario("Sofía", "Ramos", "terapeuta@trama.test"),
                Especialidad.TERAPIA_OCUPACIONAL, Especialidad.ACOMPANANTE_TERAPEUTICO);

        // Niños ficticios
        Proyecto tomi = crearProyecto("Tomás", "Fernández", "Tomi",
                LocalDate.of(2017, 5, 12), "Escuela N.º 12 D.E. 4", "3.º grado", TipoEscuela.COMUN);
        Proyecto valen = crearProyecto("Valentina", "Ruiz", "Valen",
                LocalDate.of(2018, 9, 3), "Instituto San Martín", "2.º grado", TipoEscuela.HIBRIDA);
        Proyecto juli = crearProyecto("Julián", "Gómez", "Juli",
                LocalDate.of(2016, 2, 20), "Escuela N.º 7 D.E. 9", "4.º grado", TipoEscuela.ESPECIAL);

        // Cada proyecto con miembros de los 4 roles
        crearMembresia(tutor, tomi, Rol.TUTOR, true, null, null);
        crearMembresia(cotutor, tomi, Rol.TUTOR, true, null, null);
        crearMembresia(familiar, tomi, Rol.FAMILIAR, false, null, null);
        crearMembresia(docente, tomi, Rol.EDUCACION, false,
                Especialidad.DOCENTE_PRIMARIO, null);
        crearMembresia(psico, tomi, Rol.SALUD, false,
                Especialidad.PSICOLOGIA, "MN 12345");

        crearMembresia(tutoraValen, valen, Rol.TUTOR, true, null, null);
        crearMembresia(familiar, valen, Rol.FAMILIAR, false, null, null);
        crearMembresia(docente, valen, Rol.EDUCACION, false,
                Especialidad.DOCENTE_PRIMARIO, null);
        crearMembresia(psico, valen, Rol.SALUD, false,
                Especialidad.PSICOLOGIA, "MN 12345");

        crearMembresia(tutorJuli, juli, Rol.TUTOR, true, null, null);
        crearMembresia(familiar, juli, Rol.FAMILIAR, false, null, null);
        crearMembresia(docente, juli, Rol.EDUCACION, false,
                Especialidad.DOCENTE_PRIMARIO, null);
        crearMembresia(psico, juli, Rol.SALUD, false,
                Especialidad.PSICOLOGIA, "MN 12345");

        // Con el plan gratuito los profesionales editan en sus dos niños más antiguos:
        // se fechan las altas para que sean siempre Tomi y Valen (Juli queda de solo lectura).
        fecharAltas(tomi, 60);
        fecharAltas(valen, 45);
        fecharAltas(juli, 30);

        cargarAportesDeTomi(tutor, cotutor, docente, psico, tomi);

        log.info("Datos de prueba cargados. Contraseña de todos los usuarios: {}", PASSWORD);
    }

    // Aportes de las seis secciones del perfil y notas profesionales, con autores y fechas variados.
    // Se cargan con AporteService, así pasan por las mismas validaciones que desde la app.
    private void cargarAportesDeTomi(Usuario tutor, Usuario cotutor, Usuario docente, Usuario psico, Proyecto tomi) {

        UUID id = tomi.getId();

        // Intereses
        aporte(tutor, id, 2, TipoAporte.INTERES, "Los dinosaurios", "Sabe el nombre de más de 30 y los ordena por tamaño.",
                "{\"categoria\":\"TEMA\",\"intensidad\":\"ALTA\"}", Visibilidad.TODOS);
        aporte(cotutor, id, 9, TipoAporte.INTERES, "Armar trenes con bloques", "Puede pasar una hora armando vías.",
                "{\"categoria\":\"JUEGO\",\"intensidad\":\"ALTA\"}", Visibilidad.TODOS);
        aporte(docente, id, 15, TipoAporte.INTERES, "Bluey", "Se calma mirando un capítulo en el recreo largo.",
                "{\"categoria\":\"PERSONAJE\",\"intensidad\":\"MEDIA\"}", Visibilidad.TODOS);
        aporte(tutor, id, 21, TipoAporte.INTERES, "Tapitas de colores", "Las junta y las clasifica por color.",
                "{\"categoria\":\"OTRO\",\"intensidad\":\"BAJA\",\"categoriaOtra\":\"Colecciones\"}", Visibilidad.TODOS);

        // Fortalezas: una por cada lugar, para ver los íconos
        aporte(tutor, id, 1, TipoAporte.FORTALEZA, "Arma rompecabezas de 100 piezas", "Empieza siempre por los bordes.",
                "{\"contexto\":\"CASA\",\"ejemplo\":\"El domingo terminó uno de animales sin ayuda.\"}", Visibilidad.TODOS);
        aporte(docente, id, 4, TipoAporte.FORTALEZA, "Memoriza rutas y horarios", "Recuerda el orden de las materias de toda la semana.",
                "{\"contexto\":\"ESCUELA\",\"ejemplo\":\"Avisó que los jueves hay música antes que el profe.\"}", Visibilidad.TODOS);
        aporte(psico, id, 12, TipoAporte.FORTALEZA, "Sigue consignas con apoyo visual", "Con una secuencia de tres pasos completa la tarea.",
                "{\"contexto\":\"CONSULTORIO\"}", Visibilidad.PROFESIONALES);
        aporte(cotutor, id, 18, TipoAporte.FORTALEZA, "Muy constante en natación", "No falta nunca y respeta los turnos.",
                "{\"contexto\":\"OTRO\",\"contextoOtro\":\"Club de natación\"}", Visibilidad.TODOS);

        // Comunicación
        aporte(psico, id, 3, TipoAporte.COMUNICACION, "Pide ayuda con una tarjeta", "Usa la tarjeta de ayuda cuando se traba.",
                "{\"categoria\":\"EXPRESION\",\"formasComunicacion\":[\"VERBAL\",\"PICTOGRAMAS\"],"
                        + "\"comoHablarle\":\"Frases cortas y de a una consigna.\",\"queEvitar\":\"Preguntas encadenadas.\"}",
                Visibilidad.TODOS);
        aporte(docente, id, 10, TipoAporte.COMUNICACION, "Necesita tiempo para responder", "Contesta si se lo espera unos segundos.",
                "{\"categoria\":\"TIEMPO_ESPERA\",\"formasComunicacion\":[\"VERBAL\"],"
                        + "\"comoHablarle\":\"Esperar sin repetir la pregunta.\",\"queEvitar\":\"Apurarlo o completar sus frases.\"}",
                Visibilidad.TODOS);
        aporte(tutor, id, 16, TipoAporte.COMUNICACION, "Señala lo que quiere", "Cuando está cansado señala en vez de hablar.",
                "{\"categoria\":\"NO_VERBAL\",\"formasComunicacion\":[\"GESTOS\"],"
                        + "\"comoHablarle\":\"Nombrar lo que señala y ofrecer dos opciones.\",\"queEvitar\":\"Pedirle que lo diga con palabras.\"}",
                Visibilidad.SOLO_TUTORES);

        // Sensorial
        aporte(docente, id, 5, TipoAporte.SENSORIAL, "Le molesta el timbre del recreo", "Se tapa los oídos y se queda quieto.",
                "{\"lista\":\"CUESTA\",\"categoria\":\"AUDICION\",\"contexto\":\"ESCUELA\"}", Visibilidad.TODOS);
        aporte(tutor, id, 8, TipoAporte.SENSORIAL, "Lo calma la manta pesada", "Antes de dormir la pide él.",
                "{\"lista\":\"AYUDA\",\"categoria\":\"TACTO\",\"contexto\":\"CASA\"}", Visibilidad.TODOS);
        aporte(psico, id, 20, TipoAporte.SENSORIAL, "Hamacarse lo regula", "Cinco minutos de hamaca antes de la sesión.",
                "{\"lista\":\"AYUDA\",\"categoria\":\"MOVIMIENTO_EQUILIBRIO\",\"contexto\":\"CONSULTORIO\"}", Visibilidad.PROFESIONALES);

        // Estrategias
        aporte(psico, id, 6, TipoAporte.ESTRATEGIA, "Anticipar con agenda visual", "Mostrar la agenda del día al llegar.",
                "{\"categoria\":\"ANTICIPACION_SECUENCIACION\",\"situacion\":\"Cambios de actividad\","
                        + "\"resultado\":\"FUNCIONO\",\"contextos\":[\"CASA\",\"ESCUELA\"]}",
                Visibilidad.TODOS);
        aporte(docente, id, 13, TipoAporte.ESTRATEGIA, "Rincón de pausa en el aula", "Puede ir al rincón cuando lo necesita.",
                "{\"categoria\":\"REGULACION_PAUSAS\",\"situacion\":\"Mucho ruido en clase\","
                        + "\"resultado\":\"FUNCIONO_EN_PARTE\",\"contextos\":[\"ESCUELA\"]}",
                Visibilidad.TODOS);
        aporte(cotutor, id, 25, TipoAporte.ESTRATEGIA, "Temporizador para terminar de jugar", "Avisar con un reloj de arena.",
                "{\"categoria\":\"ANTICIPACION_SECUENCIACION\",\"situacion\":\"Dejar la tablet\","
                        + "\"resultado\":\"NO_FUNCIONO\",\"contextos\":[\"CASA\"]}",
                Visibilidad.TODOS);

        // Rutinas
        aporte(tutor, id, 7, TipoAporte.RUTINA, "Desayuno siempre en el mismo orden", "Leche, tostada y después la fruta.",
                "{\"categoria\":\"ALIMENTACION\",\"contextos\":[\"CASA\"]}", Visibilidad.TODOS);
        aporte(cotutor, id, 11, TipoAporte.RUTINA, "Se viste con la ropa preparada", "Dejarla la noche anterior en la silla.",
                "{\"categoria\":\"VESTIDO\",\"contextos\":[\"CASA\"]}", Visibilidad.TODOS);
        aporte(tutor, id, 19, TipoAporte.RUTINA, "Cuento antes de dormir", "Siempre el mismo libro, a la misma hora.",
                "{\"categoria\":\"SUENO_DESCANSO\",\"contextos\":[\"CASA\"]}", Visibilidad.TODOS);

        // Desregulación
        aporte(docente, id, 4, TipoAporte.DESREGULACION, "Se balancea y habla más fuerte", "Suele pasar antes del recreo.",
                "{\"lista\":\"SENALES\"}", Visibilidad.TODOS);
        aporte(tutor, id, 14, TipoAporte.DESREGULACION, "Salir a un lugar tranquilo", "Acompañarlo sin hablar mucho.",
                "{\"lista\":\"AYUDA\"}", Visibilidad.TODOS);
        aporte(psico, id, 22, TipoAporte.DESREGULACION, "No tocarlo sin avisar", "Empeora si lo agarran del brazo.",
                "{\"lista\":\"EVITAR\"}", Visibilidad.PROFESIONALES);

        // Notas profesionales
        aporte(psico, id, 3, TipoAporte.NOTA_PROFESIONAL, "Avances en tolerancia a la espera",
                "En las últimas sesiones espera su turno con apoyo del temporizador.",
                "{\"tipoNota\":\"OBSERVACION\",\"fecha\":\"" + LocalDate.now().minusDays(3) + "\"}", Visibilidad.PROFESIONALES);
        aporte(docente, id, 17, TipoAporte.NOTA_PROFESIONAL, "Sugerencias para el acto escolar",
                "Ensayar con anticipación y ubicarlo cerca de la salida.",
                "{\"tipoNota\":\"ORIENTACION\",\"fecha\":\"" + LocalDate.now().minusDays(17) + "\"}", Visibilidad.TODOS);

        SecurityContextHolder.clearContext();
    }

    // Crea el aporte como si lo cargara el autor y lo fecha hace unos días
    private void aporte(Usuario autor, UUID proyectoId, int haceDias, TipoAporte tipo,
            String titulo, String contenido, String datos, Visibilidad visibilidad) {

        User principal = new User(autor.getId().toString(), "", List.of());
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        AporteResponse creado = aporteService.crear(proyectoId,
                new AporteRequest(tipo, titulo, contenido, datos, visibilidad));

        Instant fecha = Instant.now().minus(Duration.ofDays(haceDias)).minus(Duration.ofMinutes(haceDias * 37L));
        jdbcTemplate.update("UPDATE aporte SET creado_en = ?, actualizado_en = ? WHERE id = ?",
                java.sql.Timestamp.from(fecha), java.sql.Timestamp.from(fecha), bytes(creado.id()));
    }

    private void fecharAltas(Proyecto proyecto, int haceDias) {
        jdbcTemplate.update("UPDATE membresia SET fecha_alta = ? WHERE proyecto_id = ?",
                java.sql.Timestamp.from(Instant.now().minus(Duration.ofDays(haceDias))), bytes(proyecto.getId()));
    }

    private static byte[] bytes(UUID id) {
        return ByteBuffer.allocate(16)
                .putLong(id.getMostSignificantBits())
                .putLong(id.getLeastSignificantBits())
                .array();
    }

    private Usuario crearUsuario(String nombre, String apellido, String email) {

        Usuario usuario = Usuario.builder()
                .nombre(nombre)
                .apellido(apellido)
                .email(email)
                .passwordHash(passwordEncoder.encode(PASSWORD))
                .build();

        return usuarioRepository.save(usuario);
    }

    private void declararProfesional(Usuario usuario, Especialidad... especialidades) {

        usuario.setTipoCuenta(TipoCuenta.PROFESIONAL);
        usuarioRepository.save(usuario);

        for (Especialidad especialidad : especialidades) {
            usuarioEspecialidadRepository.save(UsuarioEspecialidad.builder()
                    .usuarioId(usuario.getId())
                    .especialidad(especialidad)
                    .build());
        }
    }

    private Proyecto crearProyecto(
            String nombre,
            String apellido,
            String apodo,
            LocalDate fechaNacimiento,
            String escuela,
            String grado,
            TipoEscuela tipoEscuela) {

        Proyecto proyecto = Proyecto.builder()
                .nombre(nombre)
                .apellido(apellido)
                .apodo(apodo)
                .fechaNacimiento(fechaNacimiento)
                .escuela(escuela)
                .grado(grado)
                .tipoEscuela(tipoEscuela)
                .consentimientoFecha(Instant.now())
                .build();

        return proyectoRepository.save(proyecto);
    }

    private void crearMembresia(
            Usuario usuario,
            Proyecto proyecto,
            Rol rol,
            boolean esAdmin,
            Especialidad especialidad,
            String matricula) {

        Membresia membresia = Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(esAdmin)
                .matricula(matricula)
                .build();

        membresia = membresiaRepository.save(membresia);

        // Si tiene especialidad, agregar a la tabla de especialidades.
        if (especialidad != null) {
            MembresiaEspecialidad me = MembresiaEspecialidad.builder()
                    .membresia(membresia)
                    .especialidad(especialidad)
                    .build();

            membresia.getEspecialidades().add(me);
            membresiaRepository.save(membresia);
        }
    }
}
