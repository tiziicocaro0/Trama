
package com.trama.tpo.demo.archivo;

import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.ArchivoStorageService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.UsuarioActual;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.Visibilidad;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArchivoServiceTest {

    @Mock
    private ArchivoRepository archivoRepository;

    @Mock
    private ArchivoStorageService archivoStorageService;

    @Mock
    private AporteRepository aporteRepository;

    @Mock
    private PermisoService permisoService;

    @Mock
    private ProyectoRepository proyectoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private UsuarioActual usuarioActual;

    @InjectMocks
    private ArchivoService archivoService;

    @Test
    void subirPdfValidoGuardaArchivo() {

        UUID proyectoId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        UUID ruta = UUID.randomUUID();

        byte[] contenido = "%PDF-1.7\nInforme ficticio"
                .getBytes(StandardCharsets.UTF_8);

        MockMultipartFile pdf = new MockMultipartFile(
                "archivo",
                "informe.pdf",
                "application/pdf",
                contenido
        );

        Proyecto proyecto = mock(Proyecto.class);
        Usuario usuario = mock(Usuario.class);

        when(usuarioActual.obtenerId()).thenReturn(usuarioId);
        when(proyectoRepository.findById(proyectoId))
                .thenReturn(Optional.of(proyecto));
        when(usuarioRepository.findById(usuarioId))
                .thenReturn(Optional.of(usuario));

        when(archivoStorageService.guardar(any(byte[].class)))
                .thenReturn(ruta);

        when(archivoRepository.save(any(Archivo.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));

        Archivo resultado = archivoService.subir(proyectoId, pdf);

        assertThat(resultado.getNombreOriginal())
                .isEqualTo("informe.pdf");

        assertThat(resultado.getTipoMime())
                .isEqualTo("application/pdf");

        assertThat(resultado.getTamanoBytes())
                .isEqualTo(contenido.length);

        assertThat(resultado.getRuta())
                .isEqualTo(ruta.toString());

        verify(permisoService).verificarPuedeEditar(proyectoId);
        verify(archivoStorageService).guardar(contenido);
        verify(archivoRepository).save(any(Archivo.class));
    }

    @Test
    void subirExeDevuelveError() {

        UUID proyectoId = UUID.randomUUID();

        MockMultipartFile ejecutable = new MockMultipartFile(
                "archivo",
                "programa.exe",
                "application/octet-stream",
                new byte[] {1, 2, 3, 4}
        );

        assertThatThrownBy(
                () -> archivoService.subir(proyectoId, ejecutable)
        ).isInstanceOf(ApiException.class);

        verifyNoInteractions(archivoStorageService);
        verifyNoInteractions(archivoRepository);
    }

    @Test
    void descargarSinSerMiembroDevuelveAccesoDenegado() {

        UUID proyectoId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        doThrow(new AccessDeniedException(
                "No tenés acceso a este proyecto"))
                .when(permisoService)
                .verificarMiembro(proyectoId);

        assertThatThrownBy(
                () -> archivoService.descargar(proyectoId, archivoId)
        ).isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(archivoRepository);
        verifyNoInteractions(archivoStorageService);
    }

    @Test
    void subirArchivoMayorACincoMbDevuelveError() {

        UUID proyectoId = UUID.randomUUID();

        byte[] contenido = new byte[5 * 1024 * 1024 + 1];

        MockMultipartFile archivoGrande = new MockMultipartFile(
                "archivo",
                "informe.pdf",
                "application/pdf",
                contenido
        );

        assertThatThrownBy(
                () -> archivoService.subir(proyectoId, archivoGrande)
        ).isInstanceOf(ApiException.class);

        verifyNoInteractions(archivoStorageService);
        verifyNoInteractions(archivoRepository);
    }
    @Test
    void noPermiteDescargarArchivoDeAportePrivado() {

        UUID proyectoId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        Archivo archivo = Archivo.builder()
                .ruta(UUID.randomUUID().toString())
                .build();

        Aporte aporte = mock(Aporte.class);

        when(archivoRepository.findByIdAndProyecto_Id(
                archivoId, proyectoId))
                .thenReturn(Optional.of(archivo));

        when(aporteRepository.buscarAportesPorArchivo(
                proyectoId, archivoId))
                .thenReturn(List.of(aporte));

        when(aporte.getVisibilidad())
                .thenReturn(Visibilidad.SOLO_SALUD);

        doThrow(new AccessDeniedException(
                "No tenés permiso para ver este aporte"))
                .when(permisoService)
                .verificarPuedeVerAporte(
                        proyectoId,
                        Visibilidad.SOLO_SALUD);

        assertThatThrownBy(() ->
                archivoService.descargar(proyectoId, archivoId))
                .isInstanceOf(AccessDeniedException.class);

        verifyNoInteractions(archivoStorageService);
    }

}
