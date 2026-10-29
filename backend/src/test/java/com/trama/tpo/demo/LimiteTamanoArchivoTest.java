package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataAccessException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.unit.DataSize;

import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.ArchivoService;

/**
 * 4.3: el tamaño máximo de un archivo adjunto tiene que ser el mismo en todas las capas.
 * La fuente es ArchivoService.TAMANO_MAXIMO_BYTES. Si alguien cambia el límite en un solo
 * lugar (migración, multipart de Spring o frontend), este test falla en local y en el CI.
 */
@SpringBootTest
@ActiveProfiles("test")
class LimiteTamanoArchivoTest {

    private static final long LIMITE = ArchivoService.TAMANO_MAXIMO_BYTES;

    @Autowired private ArchivoRepository archivoRepository;
    @Autowired private ProyectoRepository proyectoRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @Value("${spring.servlet.multipart.max-file-size}")
    private DataSize limiteMultipart;

    private Usuario autor;
    private Proyecto proyecto;

    @BeforeEach
    void prepararDatos() {
        autor = usuarioRepository.save(Usuario.builder()
                .nombre("LimiteArchivo")
                .apellido("Prueba")
                .email("limite." + UUID.randomUUID() + "@example.com")
                .passwordHash("no-se-usa-en-estos-tests")
                .build());

        proyecto = proyectoRepository.save(Proyecto.builder()
                .nombre("Niño")
                .apellido("Ficticio")
                .fechaNacimiento(LocalDate.of(2017, 1, 1))
                .escuela("Escuela de prueba")
                .grado("3.º grado")
                .consentimientoFecha(Instant.now())
                .build());
    }

    @AfterEach
    void limpiarDatos() {
        archivoRepository.deleteAll(archivoRepository.findByProyectoId(proyecto.getId()));
        proyectoRepository.delete(proyecto);
        usuarioRepository.deleteAll(List.of(autor));
    }

    @Test
    void elLimiteDeSpringMultipartCoincideConElDelService() {
        assertEquals(LIMITE, limiteMultipart.toBytes(),
                "spring.servlet.multipart.max-file-size no coincide con ArchivoService.TAMANO_MAXIMO_BYTES");
    }

    @Test
    void laBaseAceptaUnArchivoDelTamanoMaximo() {
        assertDoesNotThrow(() -> archivoRepository.saveAndFlush(archivoDe(LIMITE)));
    }

    @Test
    void laBaseRechazaUnArchivoMasGrandeQueElMaximo() {
        assertThrows(DataAccessException.class,
                () -> archivoRepository.saveAndFlush(archivoDe(LIMITE + 1)),
                "El CHECK ck_archivo_tamano de la migración no coincide con ArchivoService.TAMANO_MAXIMO_BYTES");
    }

    @Test
    void elFrontendUsaElMismoLimite() throws IOException {
        // Los tests corren desde backend/: el front está en la carpeta hermana.
        Path archivosJs = Path.of("..", "frontend", "src", "api", "archivos.js");
        String codigo = Files.readString(archivosJs, StandardCharsets.UTF_8);

        Matcher constante = Pattern
                .compile("TAMANO_MAXIMO_ARCHIVO\\s*=\\s*([\\d\\s*]+)")
                .matcher(codigo);
        assertTrue(constante.find(), "No se encontró TAMANO_MAXIMO_ARCHIVO en frontend/src/api/archivos.js");

        long limiteFront = 1;
        for (String factor : constante.group(1).split("\\*")) {
            if (!factor.isBlank()) {
                limiteFront *= Long.parseLong(factor.trim());
            }
        }

        assertEquals(LIMITE, limiteFront,
                "TAMANO_MAXIMO_ARCHIVO del frontend no coincide con ArchivoService.TAMANO_MAXIMO_BYTES");
    }

    private Archivo archivoDe(long tamanoBytes) {
        return Archivo.builder()
                .proyecto(proyecto)
                .autor(autor)
                .nombreOriginal("informe.pdf")
                .tipoMime("application/pdf")
                .tamanoBytes(tamanoBytes)
                .ruta(UUID.randomUUID().toString())
                .build();
    }
}
