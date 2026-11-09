package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.RecursoResponse;
import com.trama.tpo.demo.entity.dto.RecursoResponse.Origen;
import com.trama.tpo.demo.entity.membresia.Rol;
import com.trama.tpo.demo.entity.registro.AccionRegistro;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Recursos del niño: la galería con todo lo que la red subió (PDF y fotos).
 * Junta los archivos subidos directo a Recursos y los adjuntos de los aportes,
 * cada uno con las reglas de visibilidad de siempre.
 */
@Service
public class RecursoService {

    static final String SECCION_AUDITORIA = "RECURSO";

    private final ArchivoRepository archivoRepository;
    private final AporteRepository aporteRepository;
    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final RegistroAccionService registroAccionService;

    public RecursoService(
            ArchivoRepository archivoRepository,
            AporteRepository aporteRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            RegistroAccionService registroAccionService) {
        this.archivoRepository = archivoRepository;
        this.aporteRepository = aporteRepository;
        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.registroAccionService = registroAccionService;
    }

    @Transactional(readOnly = true)
    public List<RecursoResponse> listar(UUID proyectoId) {

        permisoService.verificarMiembro(proyectoId);

        UUID usuarioId = usuarioActual.obtenerId();
        Rol rol = membresiaRepository.findRol(usuarioId, proyectoId)
                .orElseThrow(() -> new AccessDeniedException("No tenés acceso a este proyecto"));

        List<Visibilidad> visibilidades = PermisoService.visibilidadesPermitidas(rol);
        TipoAporte tipoOculto = permisoService.ocultaNotasProfesionales(proyectoId)
                ? TipoAporte.NOTA_PROFESIONAL
                : null;

        List<RecursoResponse> recursos = new ArrayList<>();

        for (Archivo archivo : archivoRepository.buscarRecursosVisibles(proyectoId, visibilidades)) {
            recursos.add(desdeRecurso(archivo, usuarioId));
        }

        // Adjuntos de los aportes que la persona ya puede ver (no archivados).
        // Si un archivo está en más de un aporte, se muestra una sola vez.
        Set<UUID> vistos = new HashSet<>();
        for (Aporte aporte : aporteRepository.buscarAportesVisibles(
                proyectoId, false, null, visibilidades, tipoOculto)) {
            for (Archivo archivo : aporte.getArchivos()) {
                if (vistos.add(archivo.getId())) {
                    recursos.add(desdeAporte(archivo, aporte));
                }
            }
        }

        recursos.sort(Comparator.comparing(RecursoResponse::fecha,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return recursos;
    }

    // Como un aporte: no se borra, se archiva, y solo lo hace quien lo subió
    @Transactional
    public void archivar(UUID proyectoId, UUID archivoId) {

        permisoService.verificarMiembro(proyectoId);

        Archivo archivo = archivoRepository.findByIdAndProyectoId(archivoId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "ARCHIVO_NO_ENCONTRADO",
                        "El archivo solicitado no existe",
                        HttpStatus.NOT_FOUND
                ));

        if (archivo.getVisibilidad() == null) {
            throw new ApiException(
                    "RECURSO_NO_ARCHIVABLE",
                    "Este archivo es un adjunto: se archiva junto con su aporte",
                    HttpStatus.BAD_REQUEST
            );
        }

        permisoService.verificarAutor(archivo.getAutor().getId());

        archivo.setArchivado(true);
        archivoRepository.save(archivo);

        registroAccionService.registrar(
                usuarioActual.obtenerId(), proyectoId, AccionRegistro.ARCHIVAR, SECCION_AUDITORIA);
    }

    private static RecursoResponse desdeRecurso(Archivo archivo, UUID usuarioId) {
        Usuario autor = archivo.getAutor();
        return new RecursoResponse(
                archivo.getId(),
                archivo.getNombreOriginal(),
                archivo.getTipoMime(),
                archivo.getTamanoBytes(),
                archivo.getFecha(),
                autor.getId(),
                nombreCompleto(autor),
                autor.getFotoRuta() != null,
                Origen.RECURSO,
                null,
                null,
                null,
                archivo.getVisibilidad(),
                usuarioId.equals(autor.getId())
        );
    }

    private static RecursoResponse desdeAporte(Archivo archivo, Aporte aporte) {
        Usuario autor = archivo.getAutor();
        return new RecursoResponse(
                archivo.getId(),
                archivo.getNombreOriginal(),
                archivo.getTipoMime(),
                archivo.getTamanoBytes(),
                archivo.getFecha(),
                autor.getId(),
                nombreCompleto(autor),
                autor.getFotoRuta() != null,
                Origen.APORTE,
                aporte.getTipo(),
                aporte.getId(),
                aporte.getTitulo(),
                aporte.getVisibilidad(),
                false
        );
    }

    private static String nombreCompleto(Usuario usuario) {
        return (usuario.getNombre() + " " + usuario.getApellido()).trim();
    }
}
