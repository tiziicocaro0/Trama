package com.trama.tpo.demo.service;

import com.trama.tpo.demo.aporte.Aporte;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.ArchivoResponse;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.AporteRepository;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ArchivoService {

    public static final long TAMANO_MAXIMO_BYTES = 20L * 1024L * 1024L; // 20 MB

    private static final Set<String> MIMES_PERMITIDOS = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/png"
    );

    private static final Map<String, String> EXTENSION_A_MIME = Map.of(
            "pdf", "application/pdf",
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png"
    );

    private final ArchivoRepository archivoRepository;
    private final AporteRepository aporteRepository;
    private final ProyectoRepository proyectoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final CryptoService cryptoService;
    private final Path directorioArchivos;

    public ArchivoService(
            ArchivoRepository archivoRepository,
            AporteRepository aporteRepository,
            ProyectoRepository proyectoRepository,
            UsuarioRepository usuarioRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            CryptoService cryptoService,
            @Value("${trama.archivos.directorio:./uploads}") String rutaDirectorio) {

        this.archivoRepository = archivoRepository;
        this.aporteRepository = aporteRepository;
        this.proyectoRepository = proyectoRepository;
        this.usuarioRepository = usuarioRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.cryptoService = cryptoService;
        this.directorioArchivos = Paths.get(rutaDirectorio).toAbsolutePath().normalize();
    }

    public record ArchivoDescargado(
            String nombreOriginal,
            String tipoMime,
            byte[] contenido
    ) {}

    @Transactional
    public ArchivoResponse subir(UUID proyectoId, MultipartFile archivo) {

        permisoService.verificarMiembro(proyectoId);
        permisoService.verificarPuedeEditar(proyectoId);

        if (archivo == null || archivo.isEmpty()) {
            throw new ApiException(
                    "ARCHIVO_VACIO",
                    "Seleccioná un archivo para adjuntar",
                    HttpStatus.BAD_REQUEST
            );
        }

        long tamano = archivo.getSize();
        if (tamano <= 0) {
            throw new ApiException(
                    "ARCHIVO_VACIO",
                    "El archivo seleccionado está vacío",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (tamano > TAMANO_MAXIMO_BYTES) {
            throw new ApiException(
                    "ARCHIVO_DEMASIADO_GRANDE",
                    "El archivo supera el tamaño máximo permitido de 20 MB",
                    HttpStatus.BAD_REQUEST
            );
        }

        String nombreOriginal = limpiarNombreOriginal(archivo.getOriginalFilename());
        String tipoMime = resolverYValidarTipoMime(nombreOriginal, archivo.getContentType());

        Proyecto proyecto = proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO",
                        "El proyecto no existe",
                        HttpStatus.NOT_FOUND
                ));

        UUID usuarioId = usuarioActual.obtenerId();
        Usuario autor = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO",
                        "El usuario no existe",
                        HttpStatus.NOT_FOUND
                ));

        String rutaEnDisco = UUID.randomUUID().toString();
        Path destino = directorioArchivos.resolve(rutaEnDisco).normalize();

        try {
            Files.createDirectories(directorioArchivos);
            byte[] cifrado = cryptoService.cifrar(archivo.getBytes());
            Files.write(destino, cifrado);
        } catch (IOException e) {
            throw new ApiException(
                    "ERROR_ALMACENAMIENTO",
                    "No se pudo almacenar el archivo adjunto",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        Archivo entidad = Archivo.builder()
                .proyecto(proyecto)
                .autor(autor)
                .nombreOriginal(nombreOriginal)
                .tipoMime(tipoMime)
                .tamanoBytes(tamano)
                .ruta(rutaEnDisco)
                .build();

        return ArchivoResponse.from(archivoRepository.saveAndFlush(entidad));
    }

    @Transactional(readOnly = true)
    public ArchivoDescargado descargar(UUID proyectoId, UUID archivoId) {

        permisoService.verificarMiembro(proyectoId);

        Archivo archivo = archivoRepository
                .findByIdAndProyectoId(archivoId, proyectoId)
                .orElseThrow(() -> new ApiException(
                        "ARCHIVO_NO_ENCONTRADO",
                        "El archivo solicitado no existe",
                        HttpStatus.NOT_FOUND
                ));

        List<Aporte> aportesVinculados = aporteRepository
                .findByProyectoIdAndArchivosId(proyectoId, archivoId);

        if (!aportesVinculados.isEmpty()) {
            boolean puedeVerAlguno = aportesVinculados.stream().anyMatch(aporte -> {
                try {
                    permisoService.verificarPuedeVerAporte(
                            proyectoId,
                            aporte.getVisibilidad()
                    );
                    return true;
                } catch (AccessDeniedException sinPermiso) {
                    return false;
                }
            });

            if (!puedeVerAlguno) {
                throw new AccessDeniedException(
                        "No tenés permiso para descargar este archivo"
                );
            }
        }

        Path rutaFisica = directorioArchivos.resolve(archivo.getRuta()).normalize();
        if (!Files.exists(rutaFisica)) {
            throw new ApiException(
                    "ARCHIVO_NO_ENCONTRADO",
                    "El archivo solicitado no está disponible",
                    HttpStatus.NOT_FOUND
            );
        }

        try {
            byte[] cifrado = Files.readAllBytes(rutaFisica);
            byte[] descifrado = cryptoService.descifrar(cifrado);
            return new ArchivoDescargado(
                    archivo.getNombreOriginal(),
                    archivo.getTipoMime(),
                    descifrado
            );
        } catch (IOException | IllegalStateException e) {
            throw new ApiException(
                    "ERROR_LECTURA_ARCHIVO",
                    "No se pudo leer el archivo adjunto",
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private String limpiarNombreOriginal(String nombreOriginal) {
        if (nombreOriginal == null || nombreOriginal.isBlank()) {
            return "adjunto";
        }
        String soloNombre = Paths.get(nombreOriginal).getFileName().toString().trim();
        if (soloNombre.isEmpty()) {
            return "adjunto";
        }
        return soloNombre.length() > 255 ? soloNombre.substring(0, 255) : soloNombre;
    }

    private String resolverYValidarTipoMime(String nombreOriginal, String contentType) {
        String extension = extraerExtension(nombreOriginal);
        String mimePorExtension = EXTENSION_A_MIME.get(extension);

        String mimeNormalizado = contentType == null
                ? ""
                : contentType.trim().toLowerCase(Locale.ROOT);
        if ("image/jpg".equals(mimeNormalizado)) {
            mimeNormalizado = "image/jpeg";
        }

        // Si tiene extensión pero no es pdf, jpg, jpeg ni png (ej. .exe), rechazar siempre
        if (!extension.isEmpty() && mimePorExtension == null) {
            throw new ApiException(
                    "FORMATO_NO_PERMITIDO",
                    "Formato no permitido. Solo podés adjuntar archivos PDF, JPG o PNG",
                    HttpStatus.BAD_REQUEST
            );
        }

        if (MIMES_PERMITIDOS.contains(mimeNormalizado)) {
            if (mimePorExtension != null && !mimePorExtension.equals(mimeNormalizado)) {
                throw new ApiException(
                        "FORMATO_NO_PERMITIDO",
                        "El formato del archivo no coincide con su extensión. Solo se permiten PDF, JPG o PNG",
                        HttpStatus.BAD_REQUEST
                );
            }
            return mimeNormalizado;
        }

        if (mimePorExtension != null && (mimeNormalizado.isEmpty() || "application/octet-stream".equals(mimeNormalizado))) {
            return mimePorExtension;
        }

        throw new ApiException(
                "FORMATO_NO_PERMITIDO",
                "Formato no permitido. Solo podés adjuntar archivos PDF, JPG o PNG",
                HttpStatus.BAD_REQUEST
        );
    }

    private String extraerExtension(String nombreArchivo) {
        int ultimoPunto = nombreArchivo.lastIndexOf('.');
        if (ultimoPunto < 0 || ultimoPunto == nombreArchivo.length() - 1) {
            return "";
        }
        return nombreArchivo.substring(ultimoPunto + 1).toLowerCase(Locale.ROOT);
    }
}

