package com.trama.tpo.demo.service;

import java.io.IOException;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.trama.tpo.demo.entity.dto.AuthenticationResponse;
import com.trama.tpo.demo.entity.dto.DatosCuentaRequest;
import com.trama.tpo.demo.entity.dto.MatriculaRequest;
import com.trama.tpo.demo.entity.usuario.TipoCuenta;
import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.exceptions.ApiException;
import com.trama.tpo.demo.repository.MembresiaRepository;
import com.trama.tpo.demo.repository.UsuarioRepository;

/**
 * Datos de la propia cuenta que se editan desde Mi perfil: nombre y apellido, la matrícula
 * del profesional y su comprobante opcional. La matrícula es declarada: TRAMA no la verifica.
 */
@Service
public class CuentaService {

    public record ComprobanteDescargado(String tipoMime, byte[] contenido) {}

    private final UsuarioRepository usuarioRepository;
    private final MembresiaRepository membresiaRepository;
    private final UsuarioActual usuarioActual;
    private final AuthenticationService authenticationService;
    private final AlmacenCifrado almacen;

    public CuentaService(
            UsuarioRepository usuarioRepository,
            MembresiaRepository membresiaRepository,
            UsuarioActual usuarioActual,
            AuthenticationService authenticationService,
            AlmacenCifrado almacen) {
        this.usuarioRepository = usuarioRepository;
        this.membresiaRepository = membresiaRepository;
        this.usuarioActual = usuarioActual;
        this.authenticationService = authenticationService;
        this.almacen = almacen;
    }

    // Nombre y apellido. El email no se cambia acá: es con lo que la persona ingresa.
    @Transactional
    public AuthenticationResponse actualizarDatos(DatosCuentaRequest request) {
        Usuario usuario = usuarioLogueado();
        usuario.setNombre(request.nombre());
        usuario.setApellido(request.apellido());
        usuarioRepository.save(usuario);
        return authenticationService.perfil(usuario.getId());
    }

    // Guarda o borra el número. Sin número no hay comprobante: se borra con él.
    @Transactional
    public AuthenticationResponse actualizarMatricula(MatriculaRequest request) {
        Usuario usuario = usuarioLogueado();

        if (usuario.getTipoCuenta() != TipoCuenta.PROFESIONAL && request.matricula() != null) {
            throw new ApiException(
                    "MATRICULA_SOLO_PROFESIONAL",
                    "Solo las cuentas profesionales declaran una matrícula",
                    HttpStatus.BAD_REQUEST);
        }

        usuario.setMatricula(request.matricula());
        if (request.matricula() == null) {
            borrarComprobante(usuario);
        }
        usuarioRepository.save(usuario);
        return authenticationService.perfil(usuario.getId());
    }

    // Comprobante opcional (PDF, JPG o PNG): reemplaza al anterior.
    @Transactional
    public AuthenticationResponse subirComprobante(MultipartFile archivo) {
        Usuario usuario = usuarioLogueado();
        if (usuario.getMatricula() == null) {
            throw new ApiException(
                    "MATRICULA_REQUERIDA",
                    "Primero cargá el número de matrícula",
                    HttpStatus.BAD_REQUEST);
        }
        byte[] contenido = leer(archivo);
        String tipo = tipoDeComprobante(contenido);
        if (tipo == null) {
            throw new ApiException(
                    "FORMATO_NO_PERMITIDO",
                    "El comprobante tiene que ser PDF, JPG o PNG",
                    HttpStatus.BAD_REQUEST);
        }

        String anterior = usuario.getMatriculaComprobanteRuta();
        usuario.setMatriculaComprobanteRuta(almacen.guardar(contenido));
        usuario.setMatriculaComprobanteTipo(tipo);
        usuarioRepository.save(usuario);
        if (anterior != null) almacen.borrarAlConfirmar(anterior);
        return authenticationService.perfil(usuario.getId());
    }

    @Transactional
    public AuthenticationResponse quitarComprobante() {
        Usuario usuario = usuarioLogueado();
        borrarComprobante(usuario);
        usuarioRepository.save(usuario);
        return authenticationService.perfil(usuario.getId());
    }

    // Lo ven la persona y quienes comparten algún niño con ella, como la foto.
    @Transactional(readOnly = true)
    public ComprobanteDescargado descargarComprobante(UUID usuarioId) {
        UUID yo = usuarioActual.obtenerId();
        if (!yo.equals(usuarioId) && !membresiaRepository.compartenProyecto(yo, usuarioId)) {
            throw new AccessDeniedException("No compartís ningún niño con esta persona");
        }
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .filter(u -> u.getMatriculaComprobanteRuta() != null
                        && almacen.existe(u.getMatriculaComprobanteRuta()))
                .orElseThrow(() -> new ApiException(
                        "COMPROBANTE_NO_ENCONTRADO",
                        "Esta persona no subió un comprobante de matrícula",
                        HttpStatus.NOT_FOUND));
        return new ComprobanteDescargado(
                usuario.getMatriculaComprobanteTipo(), almacen.leer(usuario.getMatriculaComprobanteRuta()));
    }

    /** PDF, JPG o PNG reales: se mira la firma del archivo, no la extensión. */
    static String tipoDeComprobante(byte[] c) {
        if (c.length >= 5 && c[0] == '%' && c[1] == 'P' && c[2] == 'D' && c[3] == 'F' && c[4] == '-') {
            return "application/pdf";
        }
        return FotoService.tipoDeImagen(c);
    }

    private byte[] leer(MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new ApiException("COMPROBANTE_VACIO", "Elegí un archivo", HttpStatus.BAD_REQUEST);
        }
        if (archivo.getSize() > ArchivoService.TAMANO_MAXIMO_BYTES) {
            throw new ApiException("COMPROBANTE_DEMASIADO_GRANDE",
                    "El comprobante supera los " + ArchivoService.TAMANO_MAXIMO_MB + " MB",
                    HttpStatus.BAD_REQUEST);
        }
        try {
            return archivo.getBytes();
        } catch (IOException e) {
            throw new ApiException("COMPROBANTE_VACIO", "No pudimos leer el archivo", HttpStatus.BAD_REQUEST);
        }
    }

    private void borrarComprobante(Usuario usuario) {
        String anterior = usuario.getMatriculaComprobanteRuta();
        usuario.setMatriculaComprobanteRuta(null);
        usuario.setMatriculaComprobanteTipo(null);
        if (anterior != null) almacen.borrarAlConfirmar(anterior);
    }

    private Usuario usuarioLogueado() {
        return usuarioRepository.findById(usuarioActual.obtenerId())
                .orElseThrow(() -> new ApiException(
                        "USUARIO_NO_ENCONTRADO", "Usuario no encontrado", HttpStatus.NOT_FOUND));
    }
}
