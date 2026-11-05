package com.trama.tpo.demo.service;

import java.io.IOException;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.dto.FotoResponse;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.ArchivoRepository;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.ProyectoRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * Fotos de perfil: la del niño (la cambia el tutor administrador) y la de cada cuenta.
 * El front sube la imagen ya recortada; acá se valida que sea de verdad un JPG o PNG
 * y se guarda cifrada, como los adjuntos.
 */
@Service
public class FotoService {

    public record FotoDescargada(String tipoMime, byte[] contenido) {}

    private record Imagen(byte[] contenido, String tipoMime) {}

    private final ProyectoRepository proyectoRepository;
    private final ArchivoRepository archivoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final PermisoService permisoService;
    private final UsuarioActual usuarioActual;
    private final AlmacenCifrado almacen;

    public FotoService(
            ProyectoRepository proyectoRepository,
            ArchivoRepository archivoRepository,
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            PermisoService permisoService,
            UsuarioActual usuarioActual,
            AlmacenCifrado almacen) {
        this.proyectoRepository = proyectoRepository;
        this.archivoRepository = archivoRepository;
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.permisoService = permisoService;
        this.usuarioActual = usuarioActual;
        this.almacen = almacen;
    }

    // ---- Foto del niño: es un archivo más del proyecto, así la ve toda su red ----

    @Transactional
    public FotoResponse subirFotoProyecto(UUID proyectoId, MultipartFile archivo) {
        permisoService.verificarAdmin(proyectoId);
        Imagen imagen = leerImagen(archivo);
        Proyecto proyecto = buscarProyecto(proyectoId);

        String ruta = almacen.guardar(imagen.contenido());
        Archivo nueva = archivoRepository.saveAndFlush(Archivo.builder()
                .proyecto(proyecto)
                .autor(usuarioLogueado())
                .nombreOriginal("image/png".equals(imagen.tipoMime()) ? "foto.png" : "foto.jpg")
                .tipoMime(imagen.tipoMime())
                .tamanoBytes((long) imagen.contenido().length)
                .ruta(ruta)
                .build());

        UUID anterior = proyecto.getFotoArchivoId();
        proyecto.setFotoArchivoId(nueva.getId());
        proyectoRepository.save(proyecto);
        borrarArchivo(anterior);
        return new FotoResponse(nueva.getId());
    }

    @Transactional
    public void quitarFotoProyecto(UUID proyectoId) {
        permisoService.verificarAdmin(proyectoId);
        Proyecto proyecto = buscarProyecto(proyectoId);
        UUID anterior = proyecto.getFotoArchivoId();
        proyecto.setFotoArchivoId(null);
        proyectoRepository.save(proyecto);
        borrarArchivo(anterior);
    }

    // ---- Foto de la cuenta: la ven la persona y quienes comparten algún niño con ella ----

    @Transactional
    public void subirFotoUsuario(MultipartFile archivo) {
        Imagen imagen = leerImagen(archivo);
        Usuario usuario = usuarioLogueado();
        String anterior = usuario.getFotoRuta();
        usuario.setFotoRuta(almacen.guardar(imagen.contenido()));
        usuario.setFotoTipo(imagen.tipoMime());
        usuarioRepository.save(usuario);
        if (anterior != null) almacen.borrarAlConfirmar(anterior);
    }

    @Transactional
    public void quitarFotoUsuario() {
        Usuario usuario = usuarioLogueado();
        String anterior = usuario.getFotoRuta();
        usuario.setFotoRuta(null);
        usuario.setFotoTipo(null);
        usuarioRepository.save(usuario);
        if (anterior != null) almacen.borrarAlConfirmar(anterior);
    }

    @Transactional(readOnly = true)
    public FotoDescargada descargarFotoUsuario(UUID usuarioId) {
        UUID yo = usuarioActual.obtenerId();
        // Primero el permiso: a un ajeno no se le dice si la cuenta existe o tiene foto.
        if (!yo.equals(usuarioId) && !membresiaRepository.compartenProyecto(yo, usuarioId)) {
            throw new AccessDeniedException("No compartís ningún niño con esta persona");
        }
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .filter(u -> u.getFotoRuta() != null && almacen.existe(u.getFotoRuta()))
                .orElseThrow(() -> new ApiException(
                        "FOTO_NO_ENCONTRADA", "Esta persona no tiene foto", HttpStatus.NOT_FOUND));
        return new FotoDescargada(usuario.getFotoTipo(), almacen.leer(usuario.getFotoRuta()));
    }

    // ---- Auxiliares ----

    /** Solo JPG o PNG reales: se mira la firma del archivo, no la extensión ni lo que diga el navegador. */
    private Imagen leerImagen(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ApiException("FOTO_VACIA", "Elegí una foto", HttpStatus.BAD_REQUEST);
        }
        if (archivo.getSize() > ArchivoService.TAMANO_MAXIMO_BYTES) {
            throw new ApiException("FOTO_DEMASIADO_GRANDE",
                    "La foto supera los " + ArchivoService.TAMANO_MAXIMO_MB + " MB", HttpStatus.BAD_REQUEST);
        }
        byte[] contenido;
        try {
            contenido = archivo.getBytes();
        } catch (IOException e) {
            throw new ApiException("FOTO_VACIA", "No pudimos leer la foto", HttpStatus.BAD_REQUEST);
        }
        String tipo = tipoDeImagen(contenido);
        if (tipo == null) {
            throw new ApiException("FORMATO_NO_PERMITIDO",
                    "La foto tiene que ser JPG o PNG", HttpStatus.BAD_REQUEST);
        }
        return new Imagen(contenido, tipo);
    }

    static String tipoDeImagen(byte[] c) {
        if (c.length >= 3 && (c[0] & 0xFF) == 0xFF && (c[1] & 0xFF) == 0xD8 && (c[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (c.length >= 8 && (c[0] & 0xFF) == 0x89 && c[1] == 'P' && c[2] == 'N' && c[3] == 'G'
                && c[4] == 0x0D && c[5] == 0x0A && c[6] == 0x1A && c[7] == 0x0A) {
            return "image/png";
        }
        return null;
    }

    private void borrarArchivo(UUID archivoId) {
        if (archivoId == null) return;
        archivoRepository.findById(archivoId).ifPresent(archivo -> {
            archivoRepository.delete(archivo);
            almacen.borrarAlConfirmar(archivo.getRuta());
        });
    }

    private Proyecto buscarProyecto(UUID proyectoId) {
        return proyectoRepository.findById(proyectoId)
                .orElseThrow(() -> new ApiException(
                        "PROYECTO_NO_ENCONTRADO", "El proyecto no existe", HttpStatus.NOT_FOUND));
    }

    private Usuario usuarioLogueado() {
        return usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO", "Usuario no encontrado", HttpStatus.NOT_FOUND));
    }
}
