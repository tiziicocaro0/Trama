package com.trama.tpo.demo.config;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.trama.tpo.demo.entity.membresia.Especialidad;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.MembresiaEspecialidad;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final String PASSWORD = "Trama1234!";

    private final UsuarioRepository usuarioRepository;
    private final ProyectoRepository proyectoRepository;
    private final MembresiaRepository membresiaRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UsuarioRepository usuarioRepository,
            ProyectoRepository proyectoRepository,
            MembresiaRepository membresiaRepository,
            PasswordEncoder passwordEncoder) {

        this.usuarioRepository = usuarioRepository;
        this.proyectoRepository = proyectoRepository;
        this.membresiaRepository = membresiaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {

        // Si ya se cargaron los datos, no se vuelven a cargar
        if (usuarioRepository.existsByEmail("tutor@trama.test")) {
            log.info("DataSeeder: los datos mock ya existen");
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

        // Niños ficticios
        Proyecto tomi = crearProyecto("Tomás", "Fernández", "Tomi",
                LocalDate.of(2017, 5, 12), "Escuela N.º 12 D.E. 4", "3.º grado");
        Proyecto valen = crearProyecto("Valentina", "Ruiz", "Valen",
                LocalDate.of(2018, 9, 3), "Instituto San Martín", "2.º grado");
        Proyecto juli = crearProyecto("Julián", "Gómez", "Juli",
                LocalDate.of(2016, 2, 20), "Escuela N.º 7 D.E. 9", "4.º grado");

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

        log.info("DataSeeder: datos mock cargados");
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

    private Proyecto crearProyecto(
            String nombre,
            String apellido,
            String apodo,
            LocalDate fechaNacimiento,
            String escuela,
            String grado) {

        Proyecto proyecto = Proyecto.builder()
                .nombre(nombre)
                .apellido(apellido)
                .apodo(apodo)
                .fechaNacimiento(fechaNacimiento)
                .escuela(escuela)
                .grado(grado)
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
