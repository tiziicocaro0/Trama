
package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.Comentario;
import com.trama.tpo.demo.entity.dto.ComentarioRequest;
import com.trama.tpo.demo.entity.dto.ComentarioResponse;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.ComentarioRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Service
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;
    private final AporteRepository aporteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final AvisoMencionService avisoMencionService;

    public ComentarioService(
            ComentarioRepository comentarioRepository,
            AporteRepository aporteRepository,
            UsuarioRepository usuarioRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            AvisoMencionService avisoMencionService) {

        this.comentarioRepository = comentarioRepository;
        this.aporteRepository = aporteRepository;
        this.usuarioRepository = usuarioRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.avisoMencionService = avisoMencionService;
    }

    // CREAR COMENTARIO
    @Transactional
    public ComentarioResponse crear(
            UUID proyectoId,
            UUID aporteId,
            ComentarioRequest request) {

        // Verificar que el usuario pueda ver este aporte.
        Aporte aporte = obtenerAporteVisible(proyectoId, aporteId);

        // No permitir nuevos comentarios en aportes archivados.
        if (Boolean.TRUE.equals(aporte.getArchivado())) {
            throw new ApiException(
                    "APORTE_ARCHIVADO",
                    "No se puede comentar un aporte archivado",
                    HttpStatus.CONFLICT
            );
        }

        // Validar el contenido antes de guardarlo.
        String texto = validarTexto(request);

        // Obtener el autor desde el usuario autenticado.
        UUID usuarioId = usuarioActual.obtenerId();

        Usuario autor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "Usuario no encontrado",
                        HttpStatus.NOT_FOUND
                ));

        // Crear el comentario.
        Comentario comentario = Comentario.builder()
                .aporte(aporte)
                .autor(autor)
                .texto(texto)
                .build();

        // Guardarlo en MySQL.
        // El CifradoConverter cifra automáticamente el texto.
        Comentario guardado =
                comentarioRepository.saveAndFlush(comentario);

        // HISTORIA 6.2: NOTIFICAR MENCIONES
        // Buscar @nombre dentro del comentario y notificar
        // solamente a los miembros autorizados.
        avisoMencionService.notificarMenciones(
                aporte,
                usuarioId,
                texto
        );

        // Devolver el comentario al frontend.
        return convertir(guardado);
    }

    // LISTAR COMENTARIOS DE UN APORTE
    @Transactional(readOnly = true)
    public List<ComentarioResponse> listar(
            UUID proyectoId,
            UUID aporteId) {

        // Verificar permisos antes de consultar.
        obtenerAporteVisible(proyectoId, aporteId);

        // Recuperar comentarios en orden cronológico.
        return comentarioRepository
                .findByAporteIdOrderByFechaAscIdAsc(aporteId)
                .stream()
                .map(this::convertir)
                .toList();
    }

    // VERIFICAR ACCESO AL APORTE
    private Aporte obtenerAporteVisible(
            UUID proyectoId,
            UUID aporteId) {

        // El usuario debe pertenecer al proyecto.
        permisoService.verificarMiembro(proyectoId);

        // El aporte debe existir y pertenecer a ese proyecto.
        Aporte aporte = aporteRepository
                .findByIdAndProyectoId(aporteId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "APORTE_NO_ENCONTRADO",
                        "El aporte no existe",
                        HttpStatus.NOT_FOUND
                ));

        // Respetar la visibilidad del aporte
        // y las restricciones de notas profesionales.
        permisoService.verificarPuedeVerAporte(
                proyectoId,
                aporte.getVisibilidad(),
                aporte.getTipo()
        );

        return aporte;
    }

    // VALIDAR CONTENIDO DEL COMENTARIO
    private String validarTexto(ComentarioRequest request) {

        if (request == null
                || request.texto() == null
                || request.texto().isBlank()) {

            throw new ApiException(
                    "COMENTARIO_INVALIDO",
                    "El comentario no puede estar vacío",
                    HttpStatus.BAD_REQUEST
            );
        }

        String texto = request.texto().trim();

        // La columna VARBINARY admite 4096 bytes.
        // AES-GCM agrega 12 bytes de IV y 16 de autenticación.
        int bytesTexto =
                texto.getBytes(StandardCharsets.UTF_8).length;

        if (bytesTexto + 28 > 4096) {

            throw new ApiException(
                    "COMENTARIO_MUY_LARGO",
                    "El comentario supera el tamaño permitido",
                    HttpStatus.BAD_REQUEST
            );
        }

        return texto;
    }

    // CONVERTIR COMENTARIO A RESPUESTA
    private ComentarioResponse convertir(Comentario comentario) {

        Usuario autor = comentario.getAutor();

        String autorNombre =
                (autor.getNombre() + " " + autor.getApellido()).trim();

        return new ComentarioResponse(
                comentario.getId(),
                comentario.getAporte().getId(),
                autor.getId(),
                autorNombre,
                comentario.getTexto(),
                comentario.getFecha()
        );
    }
}
