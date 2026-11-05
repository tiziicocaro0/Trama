package com.trama.tpo.demo;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.evento.Evento;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.EventoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PanelControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private AporteRepository aporteRepository;
    @Autowired private EventoRepository eventoRepository;

    @AfterEach
    void limpiar() {
        eventoRepository.deleteAll();
        aporteRepository.deleteAll();
        membresiaRepository.deleteAll();
        proyectoRepository.deleteAll();
        usuarioRepository.deleteAll();
    }

    @Test
    void sinTokenRecibe401() throws Exception {
        mockMvc.perform(get("/api/panel"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usuarioFamiliaSinRolProfesionalRecibe403() throws Exception {
        Usuario familiar = usuarioRepository.save(Usuario.builder()
                .nombre("Papá")
                .apellido("Ficticio")
                .email("papa." + UUID.randomUUID() + "@trama.test")
                .passwordHash("hash")
                .tipoCuenta(TipoCuenta.FAMILIA)
                .build());

        Proyecto p = crearProyecto("Hijo");
        membresiaRepository.save(Membresia.builder()
                .usuario(familiar)
                .proyecto(p)
                .rol(Rol.FAMILIAR)
                .esAdmin(false)
                .build());

        mockMvc.perform(get("/api/panel")
                .header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
    }

    @Test
    void profesionalSinProyectosDevuelveListaVacia() throws Exception {
        Usuario profesional = usuarioRepository.save(Usuario.builder()
                .nombre("Licenciada")
                .apellido("Salud")
                .email("psi." + UUID.randomUUID() + "@trama.test")
                .passwordHash("hash")
                .tipoCuenta(TipoCuenta.PROFESIONAL)
                .build());

        mockMvc.perform(get("/api/panel")
                .header("Authorization", token(profesional)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void profesionalConProyectosDevuelveNovedadesYSoloLectura() throws Exception {
        Usuario profesional = usuarioRepository.save(Usuario.builder()
                .nombre("Laura")
                .apellido("Fono")
                .email("fono." + UUID.randomUUID() + "@trama.test")
                .passwordHash("hash")
                .tipoCuenta(TipoCuenta.PROFESIONAL)
                .build());

        Usuario tutor = usuarioRepository.save(Usuario.builder()
                .nombre("Tutor")
                .apellido("Ficticio")
                .email("tutor." + UUID.randomUUID() + "@trama.test")
                .passwordHash("hash")
                .tipoCuenta(TipoCuenta.FAMILIA)
                .build());

        // Proyecto 1: Tomás (2 novedades recientes: 1 aporte y 1 evento)
        Proyecto p1 = crearProyecto("Tomás");
        membresiaRepository.save(Membresia.builder()
                .usuario(profesional)
                .proyecto(p1)
                .rol(Rol.SALUD)
                .esAdmin(false)
                .fechaAlta(Instant.now().minus(30, ChronoUnit.DAYS))
                .build());

        // Aporte reciente (cuenta)
        aporteRepository.save(Aporte.builder()
                .proyecto(p1)
                .autor(tutor)
                .tipo(TipoAporte.ESTRATEGIA)
                .titulo("Uso de apoyos visuales")
                .contenido("Funciona muy bien en el inicio de la clase")
                .visibilidad(Visibilidad.TODOS)
                .archivado(false)
                .build());

        // Aporte archivado (no debe contar)
        aporteRepository.save(Aporte.builder()
                .proyecto(p1)
                .autor(tutor)
                .tipo(TipoAporte.RUTINA)
                .titulo("Rutina vieja")
                .contenido("Descontinuada")
                .visibilidad(Visibilidad.TODOS)
                .archivado(true)
                .build());

        // Evento reciente (cuenta)
        eventoRepository.save(Evento.builder()
                .proyecto(p1)
                .autor(tutor)
                .titulo("Sesión semanal")
                .fecha(LocalDate.now().plusDays(1))
                .build());

        // Proyecto 2: Martina (0 novedades)
        Proyecto p2 = crearProyecto("Martina");
        membresiaRepository.save(Membresia.builder()
                .usuario(profesional)
                .proyecto(p2)
                .rol(Rol.SALUD)
                .esAdmin(false)
                .fechaAlta(Instant.now().minus(20, ChronoUnit.DAYS))
                .build());

        // Proyecto 3: Lucas (3er proyecto profesional gratuito -> debe estar en soloLectura = true)
        Proyecto p3 = crearProyecto("Lucas");
        membresiaRepository.save(Membresia.builder()
                .usuario(profesional)
                .proyecto(p3)
                .rol(Rol.SALUD)
                .esAdmin(false)
                .fechaAlta(Instant.now().minus(10, ChronoUnit.DAYS))
                .build());

        mockMvc.perform(get("/api/panel")
                .header("Authorization", token(profesional)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                // Proyecto 1: Tomás
                .andExpect(jsonPath("$[2].nombre").value("Tomás"))
                .andExpect(jsonPath("$[2].aportesNuevos").value(1))
                .andExpect(jsonPath("$[2].eventosNuevos").value(1))
                .andExpect(jsonPath("$[2].totalNovedades").value(2))
                .andExpect(jsonPath("$[2].soloLectura").value(false))
                // Proyecto 2: Martina (gratuito 2do)
                .andExpect(jsonPath("$[1].nombre").value("Martina"))
                .andExpect(jsonPath("$[1].totalNovedades").value(0))
                .andExpect(jsonPath("$[1].soloLectura").value(false))
                // Proyecto 3: Lucas (3er niño -> excede el plan gratuito de 2 niños)
                .andExpect(jsonPath("$[0].nombre").value("Lucas"))
                .andExpect(jsonPath("$[0].soloLectura").value(true));
    }

    private Proyecto crearProyecto(String nombre) {
        return proyectoRepository.save(Proyecto.builder()
                .nombre(nombre)
                .apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2018, 4, 15))
                .escuela("Escuela N.º 12")
                .grado("1.º grado")
                .consentimientoFecha(Instant.now())
                .build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}

