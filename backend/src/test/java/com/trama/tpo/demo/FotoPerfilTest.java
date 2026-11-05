package com.trama.tpo.demo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trama.tpo.demo.config.JwtService;
import com.trama.tpo.demo.entity.membresia.Membresia;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

// Fotos de perfil del niño y de la cuenta: se guardan cifradas y solo las ve la red.
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@TestPropertySource(properties = "trama.archivos.directorio=target/uploads-fotos-test")
class FotoPerfilTest {
    private static final Path DIRECTORIO = Path.of("target/uploads-fotos-test");
    // Firmas reales de JPG y PNG: el back no confía en la extensión
    private static final byte[] JPG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 1, 2, 3, 4};
    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 9, 9};

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @Autowired UsuarioRepository usuarios;
    @Autowired ProyectoRepository proyectos;
    @Autowired MembresiaRepository membresias;
    @Autowired ArchivoRepository archivos;

    private Usuario tutora;
    private Usuario familiar;
    private Usuario ajeno;
    private Proyecto proyecto;

    @BeforeEach
    void preparar() {
        tutora = usuario("Tutora");
        familiar = usuario("Familiar");
        ajeno = usuario("Ajeno");
        proyecto = proyectos.save(Proyecto.builder().nombre("Luz").apellido("Ejemplo")
                .fechaNacimiento(LocalDate.of(2018, 5, 12)).escuela("Escuela ficticia").grado("2.º grado")
                .consentimientoFecha(Instant.now()).build());
        membresias.save(Membresia.builder().proyecto(proyecto).usuario(tutora).rol(Rol.TUTOR).esAdmin(true).build());
        membresias.save(Membresia.builder().proyecto(proyecto).usuario(familiar).rol(Rol.FAMILIAR).esAdmin(false).build());
    }

    private Usuario usuario(String nombre) {
        return usuarios.save(Usuario.builder().nombre(nombre).apellido("Ejemplo")
                .email(UUID.randomUUID() + "@trama.test").passwordHash("no-se-utiliza-en-estos-tests").build());
    }

    private String token(Usuario usuario) {
        return "Bearer " + jwt.generateToken(usuario.getId());
    }

    private MockMultipartFile foto(byte[] contenido, String nombre) {
        return new MockMultipartFile("archivo", nombre, "image/jpeg", contenido);
    }

    private UUID subirFotoDelNino(byte[] contenido) throws Exception {
        var respuesta = mvc.perform(multipart("/api/proyectos/" + proyecto.getId() + "/foto")
                .file(foto(contenido, "foto.jpg")).header("Authorization", token(tutora)))
                .andExpect(status().isOk()).andReturn();
        return UUID.fromString(json.readTree(respuesta.getResponse().getContentAsString())
                .get("fotoArchivoId").asText());
    }

    @Test
    void elAdminSubeLaFotoDelNinoCifradaYLaRedLaVe() throws Exception {
        UUID fotoId = subirFotoDelNino(JPG);
        var archivo = archivos.findById(fotoId).orElseThrow();
        // En disco no queda la imagen tal cual: está cifrada
        assertThat(Files.readAllBytes(DIRECTORIO.resolve(archivo.getRuta()))).isNotEqualTo(JPG);
        mvc.perform(get("/api/proyectos/" + proyecto.getId()).header("Authorization", token(familiar)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.fotoArchivoId").value(fotoId.toString()));
        mvc.perform(get("/api/proyectos/" + proyecto.getId() + "/archivos/" + fotoId)
                .header("Authorization", token(familiar)))
                .andExpect(status().isOk()).andExpect(content().bytes(JPG));
        mvc.perform(get("/api/proyectos/" + proyecto.getId() + "/archivos/" + fotoId)
                .header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden());
    }

    @Test
    void cambiarLaFotoBorraLaAnteriorYQuitarlaLaDejaSinFoto() throws Exception {
        UUID primera = subirFotoDelNino(JPG);
        UUID segunda = subirFotoDelNino(PNG);
        assertThat(archivos.findById(primera)).isEmpty();
        assertThat(archivos.findById(segunda).orElseThrow().getTipoMime()).isEqualTo("image/png");
        mvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/foto").header("Authorization", token(tutora)))
                .andExpect(status().isNoContent());
        assertThat(proyectos.findById(proyecto.getId()).orElseThrow().getFotoArchivoId()).isNull();
        assertThat(archivos.findById(segunda)).isEmpty();
    }

    @Test
    void unMiembroQueNoEsAdminNoCambiaLaFotoDelNino() throws Exception {
        mvc.perform(multipart("/api/proyectos/" + proyecto.getId() + "/foto")
                .file(foto(JPG, "foto.jpg")).header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/proyectos/" + proyecto.getId() + "/foto").header("Authorization", token(familiar)))
                .andExpect(status().isForbidden());
    }

    @Test
    void rechazaLoQueNoEsUnaImagenAunqueDigaJpg() throws Exception {
        mvc.perform(multipart("/api/proyectos/" + proyecto.getId() + "/foto")
                .file(foto("%PDF-1.4 no es una foto".getBytes(), "foto.jpg")).header("Authorization", token(tutora)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.codigo").value("FORMATO_NO_PERMITIDO"));
        mvc.perform(multipart("/api/proyectos/" + proyecto.getId() + "/foto")
                .file(foto(new byte[0], "foto.jpg")).header("Authorization", token(tutora)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.codigo").value("FOTO_VACIA"));
        assertThat(proyectos.findById(proyecto.getId()).orElseThrow().getFotoArchivoId()).isNull();
    }

    @Test
    void laFotoDeLaCuentaLaVenSuRedYNoUnAjeno() throws Exception {
        mvc.perform(multipart("/api/usuarios/yo/foto").file(foto(PNG, "yo.png")).header("Authorization", token(familiar)))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/auth/yo").header("Authorization", token(familiar)))
                .andExpect(jsonPath("$.tieneFoto").value(true));
        mvc.perform(get("/api/proyectos/" + proyecto.getId() + "/miembros").header("Authorization", token(tutora)))
                .andExpect(jsonPath("$[?(@.rol == 'FAMILIAR')].tieneFoto").value(true));
        for (Usuario quien : new Usuario[] {familiar, tutora}) {
            mvc.perform(get("/api/usuarios/" + familiar.getId() + "/foto").header("Authorization", token(quien)))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Content-Type", "image/png"))
                    .andExpect(content().bytes(PNG));
        }
        mvc.perform(get("/api/usuarios/" + familiar.getId() + "/foto").header("Authorization", token(ajeno)))
                .andExpect(status().isForbidden());
        String ruta = usuarios.findById(familiar.getId()).orElseThrow().getFotoRuta();
        assertThat(Files.readAllBytes(DIRECTORIO.resolve(ruta))).isNotEqualTo(PNG);
    }

    @Test
    void quitarLaFotoDeLaCuenta() throws Exception {
        mvc.perform(multipart("/api/usuarios/yo/foto").file(foto(JPG, "yo.jpg")).header("Authorization", token(tutora)))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/usuarios/yo/foto").header("Authorization", token(tutora)))
                .andExpect(status().isNoContent());
        assertThat(usuarios.findById(tutora.getId()).orElseThrow().getFotoRuta()).isNull();
        mvc.perform(get("/api/usuarios/" + tutora.getId() + "/foto").header("Authorization", token(tutora)))
                .andExpect(status().isNotFound());
    }

    @Test
    void sinSesionNoSeSubeNiSeVe() throws Exception {
        mvc.perform(multipart("/api/usuarios/yo/foto").file(foto(JPG, "yo.jpg"))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/usuarios/" + tutora.getId() + "/foto")).andExpect(status().isUnauthorized());
    }
}
