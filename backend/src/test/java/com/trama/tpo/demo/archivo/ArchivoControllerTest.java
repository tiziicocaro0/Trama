package com.trama.tpo.demo.archivo;

import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.exceptions.GlobalExceptionHandler;


import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@ExtendWith(MockitoExtension.class)
class ArchivoControllerTest {

    @Mock
    private ArchivoService archivoService;

    private MockMvc mockMvc;

    @BeforeEach
    void configurar() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new ArchivoController(archivoService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void subirPdfValidoDevuelve201() throws Exception {

        UUID proyectoId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        byte[] contenido = "%PDF-1.7\nInforme ficticio"
                .getBytes(StandardCharsets.UTF_8);

        MockMultipartFile pdf = new MockMultipartFile(
                "archivo",
                "informe.pdf",
                "application/pdf",
                contenido
        );

        Archivo archivo = Archivo.builder()
                .id(archivoId)
                .nombreOriginal("informe.pdf")
                .tipoMime("application/pdf")
                .tamanoBytes(contenido.length)
                .build();

        when(archivoService.subir(
                eq(proyectoId),
                any(MultipartFile.class)))
                .thenReturn(archivo);

        mockMvc.perform(multipart(
                        "/api/proyectos/{proyectoId}/archivos",
                        proyectoId)
                        .file(pdf))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id")
                        .value(archivoId.toString()))
                .andExpect(jsonPath("$.nombreOriginal")
                        .value("informe.pdf"))
                .andExpect(jsonPath("$.tipoMime")
                        .value("application/pdf"));
    }

    @Test
    void subirExeDevuelve400() throws Exception {

        UUID proyectoId = UUID.randomUUID();

        MockMultipartFile ejecutable = new MockMultipartFile(
                "archivo",
                "programa.exe",
                "application/octet-stream",
                new byte[] {1, 2, 3, 4}
        );

        when(archivoService.subir(
                eq(proyectoId),
                any(MultipartFile.class)))
                .thenThrow(new ApiException(
                        "FORMATO_NO_PERMITIDO",
                        "Solo se permiten archivos PDF, JPG y PNG",
                        HttpStatus.BAD_REQUEST));

        mockMvc.perform(multipart(
                        "/api/proyectos/{proyectoId}/archivos",
                        proyectoId)
                        .file(ejecutable))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo")
                        .value("FORMATO_NO_PERMITIDO"));
    }

    @Test
    void descargarSinSerMiembroDevuelve403() throws Exception {

        UUID proyectoId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        when(archivoService.descargar(proyectoId, archivoId))
                .thenThrow(new AccessDeniedException(
                        "No tenés acceso a este proyecto"));

        mockMvc.perform(get(
                        "/api/proyectos/{proyectoId}/archivos/{archivoId}",
                        proyectoId,
                        archivoId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("ACCESO_DENEGADO"));
    }

    @Test
    void subirArchivoMayorAlLimiteDeSpringDevuelve400() throws Exception {

        UUID proyectoId = UUID.randomUUID();

        MockMultipartFile archivo = new MockMultipartFile(
                "archivo",
                "informe.pdf",
                "application/pdf",
                new byte[] {1, 2, 3}
        );

        when(archivoService.subir(
                eq(proyectoId),
                any(MultipartFile.class)))
                .thenThrow(new MaxUploadSizeExceededException(
                        6L * 1024 * 1024));

        mockMvc.perform(multipart(
                        "/api/proyectos/{proyectoId}/archivos",
                        proyectoId)
                        .file(archivo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.codigo")
                        .value("ARCHIVO_DEMASIADO_GRANDE"));
    }

    @Test
    void descargarArchivoPermitidoDevuelve200() throws Exception {

        UUID proyectoId = UUID.randomUUID();
        UUID archivoId = UUID.randomUUID();

        byte[] contenido = "%PDF-1.7\nInforme ficticio"
                .getBytes(StandardCharsets.UTF_8);

        ArchivoService.ArchivoDescarga descarga =
                new ArchivoService.ArchivoDescarga(
                        contenido,
                        "informe.pdf",
                        "application/pdf"
                );

        when(archivoService.descargar(proyectoId, archivoId))
                .thenReturn(descarga);

        mockMvc.perform(get(
                        "/api/proyectos/{proyectoId}/archivos/{archivoId}",
                        proyectoId,
                        archivoId))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().exists("Content-Disposition"))
                .andExpect(content().bytes(contenido));
    }

}
