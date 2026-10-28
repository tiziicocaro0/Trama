package com.trama.tpo.demo;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.AporteRequest;
import com.trama.tpo.demo.entity.dto.AporteResponse;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.AporteVersionRepository;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.AporteService;
import com.trama.tpo.demo.service.ArchivoService;
import com.trama.tpo.demo.service.ArchivoService.ArchivoDescargado;
import com.trama.tpo.demo.service.CryptoService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.UsuarioActual;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ExtendWith(MockitoExtension.class)
class ArchivoServiceTest {

    @TempDir
    Path carpetaTemporal;

    @Mock
    private ArchivoRepository archivoRepository;

    @Mock
    private AporteRepository aporteRepository;

    @Mock
    private AporteVersionRepository aporteVersionRepository;

    @Mock
    private ProyectoRepository proyectoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private MembresiaRepository membresiaRepository;

    @Mock
    private PermisoService permisoService;

    @Mock
    private UsuarioActual usuarioActual;

    private CryptoService cryptoService;
    private ArchivoService archivoService;

    @BeforeEach
    void preparar() {
        byte[] clave = new byte[32];
        new SecureRandom().nextBytes(clave);
        cryptoService = new CryptoService(Base64.getEncoder().encodeToString(clave));

        archivoService = new ArchivoService(
                archivoRepository,
                aporteRepository,
                proyectoRepository,
                usuarioRepository,
                permisoService,
                usuarioActual,
                cryptoService,
                carpetaTemporal.toString()
        );
    }

    @Test
    void subirPdfOkYDescargarComoMiembro() throws Exception {
        UUID proyectoId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        Proyecto proyecto = Proyecto.builder().id(proyectoId).build();
        Usuario autor = Usuario.builder().id(usuarioId).build();

        byte[] contenidoPdf = "%PDF-1.4 Informe escolar ficticio".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile multipart = new MockMultipartFile(
                "archivo",
                "informe-escolar.pdf",
                "application/pdf",
                contenidoPdf
        );

        when(proyectoRepository.findById(proyectoId)).thenReturn(Optional.of(proyecto));
        when(usuarioActual.obtenerId()).thenReturn(usuarioId);
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(autor));

        final Archivo[] guardadoRef = new Archivo[1];
        when(archivoRepository.saveAndFlush(any(Archivo.class))).thenAnswer(inv -> {
            Archivo a = inv.getArgument(0);
            a.setId(archivoId);
            a.setFecha(Instant.now());
            guardadoRef[0] = a;
            return a;
        });

        ArchivoResponse respuesta = archivoService.subir(proyectoId, multipart);

        verify(permisoService).verificarMiembro(proyectoId);
        verify(permisoService).verificarPuedeEditar(proyectoId);
        assertEquals(archivoId, respuesta.id());
        assertEquals("informe-escolar.pdf", respuesta.nombreOriginal());
        assertEquals("application/pdf", respuesta.tipoMime());
        assertEquals(contenidoPdf.length, respuesta.tamanoBytes());

        // Verificar que en disco está cifrado
        Path enDisco = carpetaTemporal.resolve(guardadoRef[0].getRuta());
        assertTrue(Files.exists(enDisco));
        assertFalse(java.util.Arrays.equals(contenidoPdf, Files.readAllBytes(enDisco)));

        // Ahora descargar como miembro con permiso
        when(archivoRepository.findByIdAndProyectoId(archivoId, proyectoId))
                .thenReturn(Optional.of(guardadoRef[0]));
        when(aporteRepository.findByProyectoIdAndArchivosId(proyectoId, archivoId))
                .thenReturn(List.of());

        ArchivoDescargado descargado = archivoService.descargar(proyectoId, archivoId);
        assertEquals("informe-escolar.pdf", descargado.nombreOriginal());
        assertEquals("application/pdf", descargado.tipoMime());
        assertArrayEquals(contenidoPdf, descargado.contenido());
    }

    @Test
    void subirArchivoExeDevuelve400() {
        UUID proyectoId = UUID.randomUUID();

        MockMultipartFile exe = new MockMultipartFile(
                "archivo",
                "instalador.exe",
                "application/octet-stream",
                new byte[]{0x4D, 0x5A, 0x01, 0x02}
        );

        ApiException error = assertThrows(
                ApiException.class,
                () -> archivoService.subir(proyectoId, exe)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getEstado());
        assertEquals("FORMATO_NO_PERMITIDO", error.getCodigo());
        verifyNoInteractions(archivoRepository);
    }

    @Test
    void subirArchivoMayorA20MbDevuelve400() {
        UUID proyectoId = UUID.randomUUID();

        MultipartFile archivoGrande = mock(MultipartFile.class);
        when(archivoGrande.isEmpty()).thenReturn(false);
        when(archivoGrande.getSize()).thenReturn(ArchivoService.TAMANO_MAXIMO_BYTES + 1);

        ApiException error = assertThrows(
                ApiException.class,
                () -> archivoService.subir(proyectoId, archivoGrande)
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getEstado());
        assertEquals("ARCHIVO_DEMASIADO_GRANDE", error.getCodigo());
        verifyNoInteractions(archivoRepository);
    }

    @Test
    void descargarSinSerMiembroDevuelve403() {
        UUID proyectoId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        doThrow(new AccessDeniedException("No tenés acceso a este proyecto"))
                .when(permisoService)
                .verificarMiembro(proyectoId);

        assertThrows(
                AccessDeniedException.class,
                () -> archivoService.descargar(proyectoId, archivoId)
        );

        verifyNoInteractions(archivoRepository);
    }

    @Test
    void crearAporteConArchivosAdjuntosVinculaLosArchivos() {
        UUID proyectoId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        Proyecto proyecto = Proyecto.builder().id(proyectoId).build();
        Usuario autor = Usuario.builder().id(usuarioId).build();
        Archivo archivo = Archivo.builder()
                .id(archivoId)
                .proyecto(proyecto)
                .autor(autor)
                .nombreOriginal("pictograma.png")
                .tipoMime("image/png")
                .tamanoBytes(1024L)
                .ruta(UUID.randomUUID().toString())
                .fecha(Instant.now())
                .build();

        AporteService aporteService = new AporteService(
                aporteRepository,
                aporteVersionRepository,
                proyectoRepository,
                usuarioRepository,
                membresiaRepository,
                permisoService,
                usuarioActual,
                archivoRepository
        );

        when(usuarioActual.obtenerId()).thenReturn(usuarioId);
        when(proyectoRepository.findById(proyectoId)).thenReturn(Optional.of(proyecto));
        when(usuarioRepository.findById(usuarioId)).thenReturn(Optional.of(autor));
        when(archivoRepository.findByIdAndProyectoId(archivoId, proyectoId))
                .thenReturn(Optional.of(archivo));
        when(aporteRepository.saveAndFlush(any(Aporte.class))).thenAnswer(inv -> {
            Aporte a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AporteRequest request = new AporteRequest(
                TipoAporte.COMUNICACION,
                "Tablero de pictogramas",
                "Tablero actualizado para el aula",
                null,
                Visibilidad.TODOS,
                List.of(archivoId)
        );

        AporteResponse respuesta = aporteService.crear(proyectoId, request);

        assertEquals(List.of(archivoId), respuesta.archivoIds());
        assertEquals(1, respuesta.archivos().size());
        assertEquals("pictograma.png", respuesta.archivos().get(0).nombreOriginal());
    }
}

