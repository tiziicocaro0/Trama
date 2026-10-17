package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
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

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.AporteVersion;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AporteControllerTest {

    private static final String APORTE_VALIDO = """
            {
              "tipo": "FORTALEZA",
              "titulo": "Le gusta dibujar",
              "contenido": "Disfruta dibujar animales",
              "datos": "{}",
              "visibilidad": "TODOS"
            }
            """;

    private static final String APORTE_EDITADO = """
            {
              "tipo": "FORTALEZA",
              "titulo": "Le gusta pintar",
              "contenido": "Disfruta pintar con acuarelas",
              "datos": "{}",
              "visibilidad": "TODOS"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProyectoRepository proyectoRepository;

    @Autowired
    private MembresiaRepository membresiaRepository;

    @Autowired
    private AporteRepository aporteRepository;

    @Autowired
    private AporteVersionRepository aporteVersionRepository;

    private Usuario tutorAutor;
    private Usuario otroTutor;
    private Usuario profesionalSalud;
    private Usuario profesionalEducacion;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {

        tutorAutor = crearUsuario("Autor");
        otroTutor = crearUsuario("OtroTutor");
        profesionalSalud = crearUsuario("Salud");
        profesionalEducacion = crearUsuario("Educacion");

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Prueba")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());

        crearMembresia(tutorAutor, true);
        crearMembresia(otroTutor, false);

        crearMembresiaConRol(profesionalSalud, Rol.SALUD);
        crearMembresiaConRol(profesionalEducacion, Rol.EDUCACION);
    }

    @AfterEach
    void limpiarDatos() {

        // Eliminar primero las versiones del proyecto
        aporteVersionRepository.eliminarPorProyectoId(proyecto.getId());

        // Eliminar aportes no archivados
        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), false));

        // Eliminar aportes archivados
        aporteRepository.deleteAll(
                aporteRepository.findByProyectoIdAndArchivadoOrderByCreadoEnDesc(
                        proyecto.getId(), true));

        // Eliminar membresías
        membresiaRepository.deleteAll(
                membresiaRepository.findByProyectoId(proyecto.getId()));

        // Eliminar proyecto
        proyectoRepository.delete(proyecto);

        // Eliminar usuarios
        usuarioRepository.deleteAll(List.of(
                tutorAutor,
                otroTutor,
                profesionalSalud,
                profesionalEducacion
        ));
    }

    // CRITERIO 1: un miembro autorizado puede crear un aporte
    @Test
    void crearAporteExitosamente() throws Exception {

        mockMvc.perform(post(rutaAportes())
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(APORTE_VALIDO))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.titulo").value("Le gusta dibujar"))
                .andExpect(jsonPath("$.tipo").value("FORTALEZA"))
                .andExpect(jsonPath("$.autorId")
                        .value(tutorAutor.getId().toString()))
                .andExpect(jsonPath("$.archivado").value(false));
    }

    // CRITERIO 2: solamente el autor puede editar su aporte
    @Test
    void autorPuedeEditarSuAporte() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(put(rutaAportes() + "/" + aporte.getId())
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(APORTE_EDITADO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Le gusta pintar"))
                .andExpect(jsonPath("$.contenido")
                        .value("Disfruta pintar con acuarelas"));
    }

    // CRITERIO 3: otro miembro no puede editar el aporte
    @Test
    void otroUsuarioNoPuedeEditarAporteAjeno() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(put(rutaAportes() + "/" + aporte.getId())
                .header("Authorization", token(otroTutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(APORTE_EDITADO))
                .andExpect(status().isForbidden());
    }

    // CRITERIO 4: otro miembro no puede archivar el aporte
    @Test
    void otroUsuarioNoPuedeArchivarAporteAjeno() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(post(rutaAportes() + "/" + aporte.getId() + "/archivar")
                .header("Authorization", token(otroTutor)))
                .andExpect(status().isForbidden());
    }

    // CRITERIO 5: archivar no elimina físicamente el aporte
    @Test
    void autorPuedeArchivarSinEliminarAporte() throws Exception {

        Aporte aporte = crearAporte();

        mockMvc.perform(post(rutaAportes() + "/" + aporte.getId() + "/archivar")
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isNoContent());

        Aporte archivado = aporteRepository.findById(aporte.getId())
                .orElseThrow();

        org.junit.jupiter.api.Assertions.assertTrue(
                archivado.getArchivado());
    }

    // CRITERIO 6: un miembro puede listar aportes no archivados
    @Test
    void miembroPuedeListarAportes() throws Exception {

        crearAporte();

        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(otroTutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].titulo")
                        .value("Le gusta dibujar"))
                .andExpect(jsonPath("$[0].autorId")
                        .value(tutorAutor.getId().toString()));
    }

    // CRITERIO 7: editar conserva una versión del contenido anterior
    @Test
    void editarAporteGuardaVersionAnterior() throws Exception {

        Aporte aporte = crearAporte();
        UUID aporteId = aporte.getId();

        mockMvc.perform(put(rutaAportes() + "/" + aporteId)
                .header("Authorization", token(tutorAutor))
                .contentType(MediaType.APPLICATION_JSON)
                .content(APORTE_EDITADO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.titulo").value("Le gusta pintar"))
                .andExpect(jsonPath("$.contenido")
                        .value("Disfruta pintar con acuarelas"));

        // Comprobar los datos actualizados
        Aporte actualizado = aporteRepository.findById(aporteId)
                .orElseThrow();

        assertEquals("Le gusta pintar", actualizado.getTitulo());
        assertEquals(
                "Disfruta pintar con acuarelas",
                actualizado.getContenido()
        );

        // Buscar la versión anterior
        List<AporteVersion> versiones =
                aporteVersionRepository.findAll().stream()
                        .filter(version ->
                                version.getAporte().getId().equals(aporteId))
                        .toList();

        assertEquals(1, versiones.size());

        AporteVersion versionAnterior = versiones.get(0);

        assertEquals(
                "Le gusta dibujar",
                versionAnterior.getTitulo()
        );

        assertEquals(
                "Disfruta dibujar animales",
                versionAnterior.getContenido()
        );

        assertEquals("{}", versionAnterior.getDatos());

        assertEquals(
                tutorAutor.getId(),
                versionAnterior.getAutor().getId()
        );
    }

    // CRITERIO 8: cada rol ve solamente los aportes permitidos
    @Test
    void listarAportesRespetaVisibilidadPorRol() throws Exception {

        crearAporteConVisibilidad(
                "Aporte público", Visibilidad.TODOS);

        crearAporteConVisibilidad(
                "Solo tutores", Visibilidad.SOLO_TUTORES);

        crearAporteConVisibilidad(
                "Solo salud", Visibilidad.SOLO_SALUD);

        crearAporteConVisibilidad(
                "Solo educación", Visibilidad.SOLO_EDUCACION);

        // El tutor puede ver los cuatro aportes
        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(tutorAutor)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4));

        // Salud solo puede ver TODOS y SOLO_SALUD
        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(profesionalSalud)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Aporte público')]").exists())
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Solo salud')]").exists());

        // Educación solo puede ver TODOS y SOLO_EDUCACION
        mockMvc.perform(get(rutaAportes())
                .header("Authorization", token(profesionalEducacion)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Aporte público')]").exists())
                .andExpect(jsonPath(
                        "$[?(@.titulo == 'Solo educación')]").exists());
    }

    // MÉTODOS AUXILIARES

    private Aporte crearAporte() {

        return aporteRepository.saveAndFlush(Aporte.builder()
                .proyecto(proyecto)
                .autor(tutorAutor)
                .tipo(TipoAporte.FORTALEZA)
                .titulo("Le gusta dibujar")
                .contenido("Disfruta dibujar animales")
                .datos("{}")
                .visibilidad(Visibilidad.TODOS)
                .archivado(false)
                .build());
    }

    private Aporte crearAporteConVisibilidad(
            String titulo,
            Visibilidad visibilidad) {

        return aporteRepository.saveAndFlush(Aporte.builder()
                .proyecto(proyecto)
                .autor(tutorAutor)
                .tipo(TipoAporte.FORTALEZA)
                .titulo(titulo)
                .contenido("Contenido de prueba")
                .datos("{}")
                .visibilidad(visibilidad)
                .archivado(false)
                .build());
    }

    private Usuario crearUsuario(String nombre) {

        return usuarioRepository.save(Usuario.builder()
                .nombre(nombre)
                .apellido("Prueba")
                .email(nombre.toLowerCase() + "." + UUID.randomUUID()
                        + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());
    }

    private void crearMembresia(Usuario usuario, boolean esAdmin) {

        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(Rol.TUTOR)
                .esAdmin(esAdmin)
                .build());
    }

    private void crearMembresiaConRol(Usuario usuario, Rol rol) {

        membresiaRepository.save(Membresia.builder()
                .usuario(usuario)
                .proyecto(proyecto)
                .rol(rol)
                .esAdmin(false)
                .build());
    }

    private String rutaAportes() {
        return "/api/proyectos/" + proyecto.getId() + "/aportes";
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwtService.generateToken(usuario.getId());
    }
}