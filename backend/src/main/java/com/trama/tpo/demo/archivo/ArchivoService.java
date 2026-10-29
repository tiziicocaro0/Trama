package com.trama.tpo.demo.archivo;

import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;
import com.trama.tpo.demo.service.ArchivoStorageService;
import com.trama.tpo.demo.service.PermisoService;
import com.trama.tpo.demo.service.UsuarioActual;
import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.repository.AporteRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.io.IOException;
import java.util.Locale;
import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArchivoService {

    private static final long TAMANO_MAXIMO = 5L * 1024 * 1024;

    private final ArchivoRepository archivoRepository;
    private final ArchivoStorageService archivoStorageService;
    private final PermisoService permisoService;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final UsuarioActual usuarioActual;
    private final AporteRepository aporteRepository;

    @Transactional
    public Archivo subir(UUID proyectoId, MultipartFile archivo) {

        permisoService.verificarPuedeEditar(proyectoId);

        if (archivo == null || archivo.isEmpty()) {
            throw new ApiException(
                    "ARCHIVO_INVALIDO",
                    "Seleccioná un archivo para subir",
                    HttpStatus.BAD_REQUEST);
        }

        if (archivo.getSize() > TAMANO_MAXIMO) {
            throw new ApiException(
                    "ARCHIVO_DEMASIADO_GRANDE",
                    "El archivo no puede superar los 5 MB",
                    HttpStatus.BAD_REQUEST);
        }

        String nombreOriginal = obtenerNombreSeguro(archivo.getOriginalFilename());
        String tipoMime = archivo.getContentType();

        validarFormato(nombreOriginal, tipoMime);

        byte[] contenido;

        try {
            contenido = archivo.getBytes();
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo leer el archivo recibido", e);
        }

        if (contenido.length == 0 || contenido.length > TAMANO_MAXIMO) {
            throw new ApiException(
                    "ARCHIVO_INVALIDO",
                    "El archivo está vacío o supera los 5 MB",
                    HttpStatus.BAD_REQUEST);
        }

        validarContenido(contenido, tipoMime);

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO",
                        "No encontramos este proyecto",
                        HttpStatus.NOT_FOUND));

        Usuario autor = usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "No encontramos al usuario",
                        HttpStatus.NOT_FOUND));

        UUID ruta = archivoStorageService.guardar(contenido);

        Archivo nuevoArchivo = Archivo.builder()
                .proyecto(proyecto)
                .autor(autor)
                .nombreOriginal(nombreOriginal)
                .tipoMime(tipoMime)
                .tamanoBytes(contenido.length)
                .ruta(ruta.toString())
                .build();

        return archivoRepository.save(nuevoArchivo);
    }
     @Transactional(readOnly = true)
    public ArchivoDescarga descargar(UUID proyectoId, UUID archivoId) {

        // Primero comprobar que pertenece al proyecto.
        permisoService.verificarMiembro(proyectoId);

        Archivo archivo = archivoRepository
                .findByIdAndProyecto_Id(archivoId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "ARCHIVO_NO_ENCONTRADO",
                        "No encontramos este archivo",
                        HttpStatus.NOT_FOUND));

        // Buscar los aportes a los que está vinculado.
        List<Aporte> aportes = aporteRepository
                .buscarAportesPorArchivo(proyectoId, archivoId);

        if (aportes.isEmpty()) {

            // Si todavía no está adjunto a un aporte,
            // solo puede descargarlo quien lo subió.
            if (!archivo.getAutor().getId()
                    .equals(usuarioActual.obtenerId())) {

                throw new AccessDeniedException(
                        "No tenés permiso para descargar este archivo");
            }

        } else {

            // Si está vinculado a aportes, comprobar
            // la visibilidad de todos ellos.
            for (Aporte aporte : aportes) {
                permisoService.verificarPuedeVerAporte(
                        proyectoId,
                        aporte.getVisibilidad());
            }
        }

        // Leer el contenido descifrado
        byte[] contenido = archivoStorageService
                .leer(UUID.fromString(archivo.getRuta()));

        return new ArchivoDescarga(
                contenido,
                archivo.getNombreOriginal(),
                archivo.getTipoMime()
        );
    }

    public record ArchivoDescarga(
            byte[] contenido,
            String nombreOriginal,
            String tipoMime
    ) {
    }

    private String obtenerNombreSeguro(String nombre) {

        if (nombre == null || nombre.isBlank()) {
            throw new ApiException(
                    "ARCHIVO_INVALIDO",
                    "El archivo debe tener un nombre",
                    HttpStatus.BAD_REQUEST);
        }

        String normalizado = nombre.replace('\\', '/');
        String nombreSeguro = normalizado.substring(normalizado.lastIndexOf('/') + 1);

        if (nombreSeguro.isBlank() || nombreSeguro.length() > 255
                || nombreSeguro.chars().anyMatch(Character::isISOControl)) {
            throw new ApiException(
                    "ARCHIVO_INVALIDO",
                    "El nombre del archivo no es válido",
                    HttpStatus.BAD_REQUEST);
        }

        return nombreSeguro;
    }

    private void validarFormato(String nombre, String tipoMime) {

        String extension = nombre.substring(nombre.lastIndexOf('.') + 1)
                .toLowerCase(Locale.ROOT);

        boolean permitido = switch (extension) {
            case "pdf" -> "application/pdf".equals(tipoMime);
            case "jpg", "jpeg" -> "image/jpeg".equals(tipoMime);
            case "png" -> "image/png".equals(tipoMime);
            default -> false;
        };

        if (!permitido) {
            throw new ApiException(
                    "FORMATO_NO_PERMITIDO",
                    "Solo se permiten archivos PDF, JPG y PNG",
                    HttpStatus.BAD_REQUEST);
        }
    }

    private void validarContenido(byte[] datos, String tipoMime) {

        boolean valido = switch (tipoMime) {
            case "application/pdf" ->
                    datos.length >= 5
                    && datos[0] == '%'
                    && datos[1] == 'P'
                    && datos[2] == 'D'
                    && datos[3] == 'F'
                    && datos[4] == '-';

            case "image/jpeg" ->
                    datos.length >= 3
                    && (datos[0] & 0xFF) == 0xFF
                    && (datos[1] & 0xFF) == 0xD8
                    && (datos[2] & 0xFF) == 0xFF;

            case "image/png" ->
                    datos.length >= 8
                    && (datos[0] & 0xFF) == 0x89
                    && datos[1] == 'P'
                    && datos[2] == 'N'
                    && datos[3] == 'G'
                    && (datos[4] & 0xFF) == 0x0D
                    && (datos[5] & 0xFF) == 0x0A
                    && (datos[6] & 0xFF) == 0x1A
                    && (datos[7] & 0xFF) == 0x0A;

            default -> false;
        };

        if (!valido) {
            throw new ApiException(
                    "ARCHIVO_INVALIDO",
                    "El contenido del archivo no coincide con su formato",
                    HttpStatus.BAD_REQUEST);
        }
    }
}