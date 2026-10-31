package com.trama.tpo.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.invitacion.EstadoInvitacion;
import com.trama.tpo.demo.entity.invitacion.Invitacion;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.InvitacionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// 9.4: el rol lo fija quien invita; el invitado elige con qué especialidades figura en ese niño.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AceptarInvitacionComoFiguraTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtService jwtService;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private MembresiaRepository membresiaRepository;
    @Autowired private InvitacionRepository invitacionRepository;

    private Usuario madre;
    private Usuario invitada;
    private Proyecto nino;

    @BeforeEach
    void prepararDatos() {
        madre = crearUsuario("MadreFigura");
        invitada = crearUsuario("InvitadaFigura");
        nino = proyectoRepository.save(Proyecto.builder()
                .nombre("NinoFigura").apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2017, 8, 1))
                .escuela("Escuela de prueba").grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
        membresiaRepository.save(Membresia.builder()
                .usuario(madre).proyecto(nino).rol(Rol.TUTOR).esAdmin(true).build());
    }

    @AfterEach
    void limpiarDatos() {
        invitacionRepository.deleteAll(invitacionRepository.findAll().stream()
                .filter(i -> i.getProyecto().getId().equals(nino.getId())).toList());
        membresiaRepository.deleteAll(membresiaRepository.findByProyectoId(nino.getId()));
        proyectoRepository.delete(nino);
        usuarioRepository.deleteAll(List.of(madre, invitada));
    }

    @Test
    void laConsultaDeLaInvitacionTraeElNinoParaIrDespues() throws Exception {
        String token = invitar(Rol.SALUD);
        mockMvc.perform(get("/api/invitaciones/{token}", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proyectoId").value(nino.getId().toString()))
                .andExpect(jsonPath("$.rol").value("SALUD"));
    }

    @Test
    void elProfesionalSeSumaConLasEspecialidadesQueElige() throws Exception {
        aceptar(invitar(Rol.SALUD), "{\"especialidades\":[{\"especialidad\":\"PSICOLOGIA\"},{\"especialidad\":\"FONOAUDIOLOGIA\"}]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("SALUD"))
                .andExpect(jsonPath("$.especialidades.length()").value(2));
    }

    @Test
    void sinCuerpoSeSumaComoAntes() throws Exception {
        aceptar(invitar(Rol.EDUCACION), null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("EDUCACION"))
                .andExpect(jsonPath("$.especialidades").isEmpty());
    }

    @Test
    void noPuedeElegirUnaEspecialidadDeOtroRol() throws Exception {
        aceptar(invitar(Rol.EDUCACION), "{\"especialidades\":[{\"especialidad\":\"PSICOLOGIA\"}]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("ESPECIALIDAD_INCOMPATIBLE"));
    }

    @Test
    void unFamiliarNoDeclaraEspecialidadesYLaInvitacionSigueDisponible() throws Exception {
        String token = invitar(Rol.FAMILIAR);
        aceptar(token, "{\"especialidades\":[{\"especialidad\":\"PSICOLOGIA\"}]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("ROL_SIN_ESPECIALIDAD"));

        aceptar(token, "{\"especialidades\":[]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rol").value("FAMILIAR"));
    }

    // ---------------------------------------------------------------

    private ResultActions aceptar(String token, String cuerpo) throws Exception {
        var pedido = post("/api/invitaciones/{token}/aceptar", token)
                .header("Authorization", "Bearer " + jwtService.generateToken(invitada.getId()));
        if (cuerpo != null) {
            pedido = pedido.contentType(MediaType.APPLICATION_JSON).content(cuerpo);
        }
        return mockMvc.perform(pedido);
    }

    private String invitar(Rol rol) throws Exception {
        String token = "token-" + UUID.randomUUID();
        byte[] hash = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
        invitacionRepository.saveAndFlush(Invitacion.builder()
                .proyecto(nino)
                .invitadoPor(madre)
                .email(invitada.getEmail())
                .rol(rol)
                .tokenHash(HexFormat.of().formatHex(hash))
                .venceEn(Instant.now().plus(1, ChronoUnit.DAYS))
                .estado(EstadoInvitacion.PENDIENTE)
                .build());
        return token;
    }

    private Usuario crearUsuario(String nombre) {
        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre).apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }
}
