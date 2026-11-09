package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BusquedaAportesTest {
    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;
    @Autowired ProyectoRepository proyectos;
    @Autowired MembresiaRepository membresias;
    @Autowired AporteRepository aportes;
    @Autowired EntityManager entityManager;
    @Autowired JdbcTemplate jdbc;
    Usuario tutor, salud, familiar, ajeno;
    Proyecto proyecto;

    @BeforeEach
    void preparar() {
        tutor = usuario("Tutor"); salud = usuario("Salud"); familiar = usuario("Familiar"); ajeno = usuario("Ajeno");
        proyecto = proyectos.save(Proyecto.builder().nombre("Niño ficticio").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1)).escuela("Escuela ficticia").grado("3")
                .consentimientoFecha(Instant.now()).familiarVeNotas(false).build());
        membresia(tutor, Rol.TUTOR); membresia(salud, Rol.SALUD); membresia(familiar, Rol.FAMILIAR);
    }

    @Test
    void filtraVisibilidadProyectoNotasYArchivadosAntesDeBuscar() throws Exception {
        crear("Palabra pública", "contenido ficticio", Visibilidad.TODOS, TipoAporte.INTERES, false);
        crear("Palabra tutores", "contenido ficticio", Visibilidad.SOLO_TUTORES, TipoAporte.INTERES, false);
        crear("Palabra salud", "contenido ficticio", Visibilidad.SOLO_SALUD, TipoAporte.INTERES, false);
        crear("Palabra nota", "contenido ficticio", Visibilidad.TODOS, TipoAporte.NOTA_PROFESIONAL, false);
        crear("Palabra archivada", "contenido ficticio", Visibilidad.TODOS, TipoAporte.INTERES, true);
        Proyecto otro = proyectos.save(Proyecto.builder().nombre("Otro niño ficticio").apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2018, 1, 1)).escuela("Escuela ficticia").grado("2")
                .consentimientoFecha(Instant.now()).build());
        aportes.saveAndFlush(Aporte.builder().proyecto(otro).autor(tutor).tipo(TipoAporte.INTERES)
                .titulo("Palabra de otro proyecto").contenido("contenido ficticio").visibilidad(Visibilidad.TODOS).build());
        entityManager.flush(); entityManager.clear();
        consultar(familiar, "palabra").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo").value("Palabra pública"));
        consultar(salud, "palabra").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[?(@.titulo == 'Palabra tutores')]").doesNotExist());
        consultar(tutor, "palabra").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(4));
        consultar(ajeno, "palabra").andExpect(status().isForbidden());
        mvc.perform(get("/api/proyectos/{id}/buscar", proyecto.getId()).param("q", "palabra")).andExpect(status().isUnauthorized());
    }

    @Test
    void buscaContenidoCifradoSinModificarloYDevuelveSoloElDto() throws Exception {
        Aporte aporte = crear("Título ficticio", "El niño disfruta música tranquila", Visibilidad.TODOS, TipoAporte.INTERES, false);
        UUID id = aporte.getId();
        entityManager.flush(); entityManager.clear();
        byte[] cifrado = jdbc.queryForObject("SELECT contenido FROM aporte WHERE id = UUID_TO_BIN(?)", byte[].class, id.toString());
        assertThat(new String(cifrado, StandardCharsets.UTF_8)).doesNotContain("música");
        consultar(salud, "  MUSICA   tranquila ").andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id.toString()))
                .andExpect(jsonPath("$[0].fragmento").value("El niño disfruta música tranquila"))
                .andExpect(jsonPath("$[0].contenido").doesNotExist())
                .andExpect(jsonPath("$[0].autorId").doesNotExist());
        assertThat(jdbc.queryForObject("SELECT contenido FROM aporte WHERE id = UUID_TO_BIN(?)", byte[].class, id.toString())).isEqualTo(cifrado);
        consultar(salud, "sin coincidencias").andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        consultar(salud, "   ").andExpect(status().isBadRequest());
    }

    private org.springframework.test.web.servlet.ResultActions consultar(Usuario usuario, String q) throws Exception {
        return mvc.perform(get("/api/proyectos/{id}/buscar", proyecto.getId()).param("q", q)
                .header("Authorization", "Bearer " + jwt.generateToken(usuario.getId())));
    }
    private Usuario usuario(String nombre) {
        return usuarios.save(Usuario.builder().nombre(nombre).apellido("Ficticio")
                .email(UUID.randomUUID() + "@ejemplo.test").passwordHash("hash-ficticio").build());
    }
    private void membresia(Usuario usuario, Rol rol) {
        membresias.save(Membresia.builder().usuario(usuario).proyecto(proyecto).rol(rol).esAdmin(rol == Rol.TUTOR).build());
    }
    private Aporte crear(String titulo, String contenido, Visibilidad visibilidad, TipoAporte tipo, boolean archivado) {
        return aportes.saveAndFlush(Aporte.builder().proyecto(proyecto).autor(tutor).tipo(tipo).titulo(titulo)
                .contenido(contenido).visibilidad(visibilidad).archivado(archivado).build());
    }
}
