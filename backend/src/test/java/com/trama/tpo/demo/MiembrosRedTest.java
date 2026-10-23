package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.*;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.*;

/** 1.3: la pagina Red usa GET /miembros (antes habia un /red duplicado). */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MiembrosRedTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;
    @Autowired ProyectoRepository proyectos;
    @Autowired MembresiaRepository membresias;
    private Proyecto proyecto;
    private Usuario tutor;

    @BeforeEach
    void preparar() {
        proyecto = proyectos.save(Proyecto.builder().nombre("Niño ficticio").apellido("Ejemplo")
                .fechaNacimiento(LocalDate.of(2018, 5, 12)).escuela("Escuela ficticia").grado("2.º")
                .consentimientoFecha(Instant.now()).build());
        tutor = usuario("Ana tutora");
        vincular(tutor, proyecto, Rol.TUTOR, null);
    }

    @Test
    void listaTodosLosMiembrosConRolEspecialidadYFechaSinDatosDeCuenta() throws Exception {
        vincular(usuario("Docente ficticia"), proyecto, Rol.EDUCACION, "DOCENTE");
        vincular(usuario("Familiar ficticio"), proyecto, Rol.FAMILIAR, null);
        var otro = proyectos.save(Proyecto.builder().nombre("Otro niño ficticio").apellido("Ejemplo")
                .fechaNacimiento(LocalDate.of(2018, 5, 12)).escuela("Escuela ficticia").grado("2.º")
                .consentimientoFecha(Instant.now()).build());
        vincular(usuario("Profesional de otro proyecto"), otro, Rol.SALUD, "PSICOLOGIA");

        var respuesta = mvc.perform(get("/api/proyectos/" + proyecto.getId() + "/miembros")
                .header("Authorization", "Bearer " + jwt.generateToken(tutor.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                // Orden alfabetico por nombre
                .andExpect(jsonPath("$[0].nombre").value("Ana tutora"))
                .andExpect(jsonPath("$[0].rol").value("TUTOR"))
                .andExpect(jsonPath("$[1].nombre").value("Docente ficticia"))
                .andExpect(jsonPath("$[1].especialidad").value("DOCENTE"))
                .andExpect(jsonPath("$[1].fechaAlta").exists())
                .andExpect(jsonPath("$[2].rol").value("FAMILIAR"))
                .andReturn().getResponse().getContentAsString();

        assertThat(respuesta).doesNotContain("email", "password", "matricula", "otro proyecto");
    }

    @Test
    void rechazaUsuarioAjenoYSinSesion() throws Exception {
        var ajeno = usuario("Ajeno ficticio");
        mvc.perform(get("/api/proyectos/" + proyecto.getId() + "/miembros")
                .header("Authorization", "Bearer " + jwt.generateToken(ajeno.getId())))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/proyectos/" + proyecto.getId() + "/miembros"))
                .andExpect(status().isUnauthorized());
    }

    private Usuario usuario(String nombre) {
        return usuarios.save(Usuario.builder().nombre(nombre).apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("solo-tests").build());
    }

    private void vincular(Usuario usuario, Proyecto destino, Rol rol, String especialidad) {
        membresias.save(Membresia.builder().usuario(usuario).proyecto(destino).rol(rol)
                .especialidad(especialidad).build());
    }
}
