package com.trama.tpo.demo;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.EstadoRevision;
import com.trama.tpo.demo.aporte.SolicitudRevision;
import com.trama.tpo.demo.entity.dto.SolicitudRevisionRequest;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.SolicitudRevisionService;
import com.trama.tpo.demo.config.JwtService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SolicitudRevisionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private SolicitudRevisionService revisionService;
    // Repositorio para crear usuarios de prueba
        @Autowired
        private UsuarioRepository usuarioRepository;

        // Usuario autenticado para los tests
        private Usuario usuarioTest;

    private UUID proyectoId;
    private UUID aporteId;
    private UUID revisionId;
    private UUID autorId;

    private String token;

        @BeforeEach
        void preparar() {

        proyectoId = UUID.randomUUID();
        aporteId = UUID.randomUUID();
        revisionId = UUID.randomUUID();

        // Crear y guardar un usuario real para las pruebas.
        usuarioTest = usuarioRepository.save(
                Usuario.builder()
                        .nombre("UsuarioRevision")
                        .apellido("Prueba")
                        .email("revision." + UUID.randomUUID()
                                + "@example.com")
                        .passwordHash("no-se-usa-en-estos-tests")
                        .build()
        );

        // Obtener el UUID del usuario guardado.
        autorId = usuarioTest.getId();

        // Generar un JWT válido para ese usuario.
        token = "Bearer " + jwtService.generateToken(autorId);
        }
        @AfterEach
        void limpiar() {

        if (usuarioTest != null) {
                usuarioRepository.delete(usuarioTest);
        }
        }

    // Construye una revisión ficticia para las respuestas HTTP.
    private SolicitudRevision crearRevision(EstadoRevision estado) {

        Usuario autor = Usuario.builder()
                .id(autorId)
                .build();

        Aporte aporte = Aporte.builder()
                .id(aporteId)
                .autor(autor)
                .titulo("Interés por los dinosaurios")
                .build();

        return SolicitudRevision.builder()
                .id(revisionId)
                .aporte(aporte)
                .motivo("Actualizar la descripción del interés")
                .estado(estado)
                .build();
    }

    // =========================================================
    // POST - SOLICITAR REVISIÓN
    // =========================================================

    @Test
    void usuarioSinAutenticacionNoPuedeSolicitarRevision()
            throws Exception {

        mockMvc.perform(post(
                "/api/proyectos/" + proyectoId
                + "/aportes/" + aporteId + "/revision")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "motivo": "Actualizar la descripción"
                        }
                        """))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(revisionService);
    }

    @Test
    void tutorPuedeSolicitarRevision()
            throws Exception {

        when(revisionService.solicitarRevision(
                eq(proyectoId),
                eq(aporteId),
                any(SolicitudRevisionRequest.class)))
                .thenReturn(crearRevision(EstadoRevision.PENDIENTE));

        mockMvc.perform(post(
                "/api/proyectos/" + proyectoId
                + "/aportes/" + aporteId + "/revision")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "motivo": "Actualizar la descripción del interés"
                        }
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id")
                        .value(revisionId.toString()))
                .andExpect(jsonPath("$.estado")
                        .value("PENDIENTE"))
                .andExpect(jsonPath("$.mensaje")
                        .value("Solicitud de revisión creada"));

        verify(revisionService).solicitarRevision(
                eq(proyectoId),
                eq(aporteId),
                argThat(request ->
                        request.motivo().equals(
                                "Actualizar la descripción del interés")));
    }

    @Test
    void usuarioSinPermisoDeTutorRecibe403()
            throws Exception {

        when(revisionService.solicitarRevision(
                eq(proyectoId),
                eq(aporteId),
                any(SolicitudRevisionRequest.class)))
                .thenThrow(new AccessDeniedException(
                        "Solo los tutores pueden solicitar revisiones"));

        mockMvc.perform(post(
                "/api/proyectos/" + proyectoId
                + "/aportes/" + aporteId + "/revision")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "motivo": "Corregir la información"
                        }
                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("ACCESO_DENEGADO"));
    }

    @Test
    void motivoVacioRecibe400()
            throws Exception {

        mockMvc.perform(post(
                "/api/proyectos/" + proyectoId
                + "/aportes/" + aporteId + "/revision")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "motivo": ""
                        }
                        """))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(revisionService);
    }

    @Test
    void motivoAusenteRecibe400()
            throws Exception {

        mockMvc.perform(post(
                "/api/proyectos/" + proyectoId
                + "/aportes/" + aporteId + "/revision")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(revisionService);
    }

    @Test
    void revisionPendienteDuplicadaRecibe409()
            throws Exception {

        when(revisionService.solicitarRevision(
                eq(proyectoId),
                eq(aporteId),
                any(SolicitudRevisionRequest.class)))
                .thenThrow(new ApiException(
                        "REVISION_PENDIENTE",
                        "Este aporte ya tiene una revisión pendiente",
                        HttpStatus.CONFLICT));

        mockMvc.perform(post(
                "/api/proyectos/" + proyectoId
                + "/aportes/" + aporteId + "/revision")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "motivo": "Actualizar el interés"
                        }
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo")
                        .value("REVISION_PENDIENTE"));
    }

    @Test
    void aporteInexistenteRecibe404()
            throws Exception {

        when(revisionService.solicitarRevision(
                eq(proyectoId),
                eq(aporteId),
                any(SolicitudRevisionRequest.class)))
                .thenThrow(new ApiException(
                        "APORTE_NO_ENCONTRADO",
                        "El aporte no existe en este proyecto",
                        HttpStatus.NOT_FOUND));

        mockMvc.perform(post(
                "/api/proyectos/" + proyectoId
                + "/aportes/" + aporteId + "/revision")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                          "motivo": "Actualizar el aporte"
                        }
                        """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo")
                        .value("APORTE_NO_ENCONTRADO"));
    }

    // =========================================================
    // GET - CONSULTAR REVISIÓN
    // =========================================================

    @Test
    void autorPuedeConsultarMotivoDeRevision()
            throws Exception {

        when(revisionService.obtenerRevision(
                proyectoId, revisionId))
                .thenReturn(crearRevision(EstadoRevision.PENDIENTE));

        mockMvc.perform(get(
                "/api/proyectos/" + proyectoId
                + "/revisiones/" + revisionId)
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id")
                        .value(revisionId.toString()))
                .andExpect(jsonPath("$.aporteId")
                        .value(aporteId.toString()))
                .andExpect(jsonPath("$.motivo")
                        .value("Actualizar la descripción del interés"))
                .andExpect(jsonPath("$.estado")
                        .value("PENDIENTE"));

        verify(revisionService)
                .obtenerRevision(proyectoId, revisionId);
    }

    @Test
    void usuarioQueNoEsAutorNoPuedeConsultarRevision()
            throws Exception {

        when(revisionService.obtenerRevision(
                proyectoId, revisionId))
                .thenThrow(new AccessDeniedException(
                        "Solo el autor puede consultar esta revisión"));

        mockMvc.perform(get(
                "/api/proyectos/" + proyectoId
                + "/revisiones/" + revisionId)
                .header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("ACCESO_DENEGADO"));
    }

    @Test
    void revisionInexistenteRecibe404()
            throws Exception {

        when(revisionService.obtenerRevision(
                proyectoId, revisionId))
                .thenThrow(new ApiException(
                        "REVISION_NO_ENCONTRADA",
                        "La solicitud de revisión no existe",
                        HttpStatus.NOT_FOUND));

        mockMvc.perform(get(
                "/api/proyectos/" + proyectoId
                + "/revisiones/" + revisionId)
                .header("Authorization", token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo")
                        .value("REVISION_NO_ENCONTRADA"));
    }

    // =========================================================
    // PUT - MARCAR COMO REVISADA
    // =========================================================

    @Test
    void autorPuedeMarcarRevisionComoRevisada()
            throws Exception {

        when(revisionService.marcarComoRevisada(
                proyectoId, revisionId))
                .thenReturn(crearRevision(EstadoRevision.REVISADA));

        mockMvc.perform(put(
                "/api/proyectos/" + proyectoId
                + "/revisiones/" + revisionId)
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id")
                        .value(revisionId.toString()))
                .andExpect(jsonPath("$.estado")
                        .value("REVISADA"))
                .andExpect(jsonPath("$.mensaje")
                        .value("Solicitud marcada como revisada"));

        verify(revisionService)
                .marcarComoRevisada(proyectoId, revisionId);
    }

    @Test
    void usuarioQueNoEsAutorNoPuedeMarcarComoRevisada()
            throws Exception {

        when(revisionService.marcarComoRevisada(
                proyectoId, revisionId))
                .thenThrow(new AccessDeniedException(
                        "Solo el autor puede modificar este aporte"));

        mockMvc.perform(put(
                "/api/proyectos/" + proyectoId
                + "/revisiones/" + revisionId)
                .header("Authorization", token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.codigo")
                        .value("ACCESO_DENEGADO"));
    }

    @Test
    void revisionYaRevisadaRecibe409()
            throws Exception {

        when(revisionService.marcarComoRevisada(
                proyectoId, revisionId))
                .thenThrow(new ApiException(
                        "REVISION_YA_REVISADA",
                        "La solicitud ya fue marcada como revisada",
                        HttpStatus.CONFLICT));

        mockMvc.perform(put(
                "/api/proyectos/" + proyectoId
                + "/revisiones/" + revisionId)
                .header("Authorization", token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo")
                        .value("REVISION_YA_REVISADA"));
    }
}