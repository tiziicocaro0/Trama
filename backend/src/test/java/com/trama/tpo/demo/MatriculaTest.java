package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.EmailService;

// Matrícula declarada por el profesional: se carga al registrarse o desde Mi perfil y la ve su red.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MatriculaTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;
    @Autowired ProyectoRepository proyectos;
    @Autowired MembresiaRepository membresias;

    // El registro manda un código por mail: en los tests no hay SMTP.
    @MockBean EmailService emailService;

    private Map<String, Object> registro(String tipoCuenta, String matricula) {
        Map<String, Object> datos = new HashMap<>(Map.of(
                "nombre", "Pía", "apellido", "Ejemplo",
                "email", UUID.randomUUID() + "@trama.test", "password", "Prueba123!",
                "tipoCuenta", tipoCuenta));
        if ("PROFESIONAL".equals(tipoCuenta)) {
            datos.put("especialidades", List.of(Map.of("especialidad", "PSICOLOGIA")));
        }
        if (matricula != null) datos.put("matricula", matricula);
        return datos;
    }

    private Usuario usuario(TipoCuenta tipo, String matricula) {
        return usuarios.save(Usuario.builder().nombre("Pía").apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("no-se-utiliza-en-estos-tests")
                .tipoCuenta(tipo).matricula(matricula).build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwt.generateToken(usuario.getId());
    }

    private void cambiarMatricula(Usuario usuario, String cuerpo, int estado) throws Exception {
        mvc.perform(put("/api/usuarios/yo/matricula").header("Authorization", token(usuario))
                .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().is(estado));
    }

    @Test
    void elProfesionalLaDeclaraAlRegistrarseYLaVeEnSuCuenta() throws Exception {
        var datos = registro("PROFESIONAL", "  MN 45.123  ");
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(datos))).andExpect(status().isCreated());
        Usuario creado = usuarios.findByEmail((String) datos.get("email")).orElseThrow();
        assertThat(creado.getMatricula()).isEqualTo("MN 45.123");
        mvc.perform(get("/api/auth/yo").header("Authorization", token(creado)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.matricula").value("MN 45.123"));
    }

    @Test
    void esOpcional() throws Exception {
        var datos = registro("PROFESIONAL", "   ");
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(datos))).andExpect(status().isCreated());
        assertThat(usuarios.findByEmail((String) datos.get("email")).orElseThrow().getMatricula()).isNull();
    }

    @Test
    void unaFamiliaNoDeclaraMatricula() throws Exception {
        var datos = registro("FAMILIA", "MN 1");
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(datos)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo").value("MATRICULA_SOLO_PROFESIONAL"));
        assertThat(usuarios.findByEmail((String) datos.get("email"))).isEmpty();
    }

    @Test
    void noPuedeSuperarLos40Caracteres() throws Exception {
        var datos = registro("PROFESIONAL", "M".repeat(41));
        mvc.perform(post("/api/auth/registro").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(datos))).andExpect(status().isBadRequest());
        assertThat(usuarios.findByEmail((String) datos.get("email"))).isEmpty();
    }

    @Test
    void elProfesionalLaCambiaYLaBorraDesdeMiPerfil() throws Exception {
        Usuario profesional = usuario(TipoCuenta.PROFESIONAL, null);
        mvc.perform(put("/api/usuarios/yo/matricula").header("Authorization", token(profesional))
                .contentType(MediaType.APPLICATION_JSON).content("{\"matricula\":\" MP 778 \"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.matricula").value("MP 778"));
        assertThat(usuarios.findById(profesional.getId()).orElseThrow().getMatricula()).isEqualTo("MP 778");
        cambiarMatricula(profesional, "{\"matricula\":\"\"}", 200);
        assertThat(usuarios.findById(profesional.getId()).orElseThrow().getMatricula()).isNull();
        cambiarMatricula(profesional, "{\"matricula\":\"" + "M".repeat(41) + "\"}", 400);
    }

    @Test
    void unaCuentaDeFamiliaNoLaPuedeCargar() throws Exception {
        Usuario familia = usuario(TipoCuenta.FAMILIA, null);
        cambiarMatricula(familia, "{\"matricula\":\"MN 1\"}", 400);
        assertThat(usuarios.findById(familia.getId()).orElseThrow().getMatricula()).isNull();
    }

    @Test
    void sinSesionRecibe401() throws Exception {
        mvc.perform(put("/api/usuarios/yo/matricula").contentType(MediaType.APPLICATION_JSON)
                .content("{\"matricula\":\"MN 1\"}")).andExpect(status().isUnauthorized());
    }

    @Test
    void laRedVeLaMatriculaDelProfesional() throws Exception {
        Usuario tutora = usuario(TipoCuenta.FAMILIA, null);
        Usuario psicologa = usuario(TipoCuenta.PROFESIONAL, "MN 45.123");
        Proyecto proyecto = proyectos.save(Proyecto.builder().nombre("Luz").apellido("Ejemplo")
                .fechaNacimiento(LocalDate.of(2018, 5, 12)).escuela("Escuela ficticia").grado("2.º grado")
                .consentimientoFecha(Instant.now()).build());
        membresias.save(Membresia.builder().proyecto(proyecto).usuario(tutora)
                .rol(Rol.TUTOR).esAdmin(true).build());
        membresias.save(Membresia.builder().proyecto(proyecto).usuario(psicologa)
                .rol(Rol.SALUD).esAdmin(false).build());
        mvc.perform(get("/api/proyectos/" + proyecto.getId() + "/miembros").header("Authorization", token(tutora)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.rol == 'SALUD')].matricula").value("MN 45.123"));
    }
}
