package com.trama.tpo.demo.exceptions;

import com.trama.tpo.demo.service.ArchivoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.http.converter.HttpMessageNotReadableException;


@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    public record ErrorResponse(
            String codigo,
            String mensaje
    ) {}

    // ERRORES DE NEGOCIO
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(
            ApiException e) {

        return ResponseEntity
                .status(e.getEstado())
                .body(new ErrorResponse(
                        e.getCodigo(),
                        e.getMessage()
                ));
    }

    // CREDENCIALES INCORRECTAS
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException e) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(
                        "CREDENCIALES_INVALIDAS",
                        "Email o contraseña inválidos"
                ));
    }

    // OTROS ERRORES DE AUTENTICACION
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException e) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(
                        "NO_AUTENTICADO",
                        "Debés iniciar sesión"
                ));
    }

    // ACCESO DENEGADO
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException e) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(
                        "ACCESO_DENEGADO",
                        "No tenés permiso para realizar esta acción"
                ));
    }

    // 9.0: PROFESIONAL EN SOLO LECTURA POR EL PLAN GRATUITO (más específico que ACCESO_DENEGADO)
    @ExceptionHandler(SoloLecturaException.class)
    public ResponseEntity<ErrorResponse> handleSoloLectura(
            SoloLecturaException e) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(
                        "SOLO_LECTURA",
                        e.getMessage()
                ));
    }

    // TAMAÑO MÁXIMO DE ARCHIVO SUPERADO
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(
            MaxUploadSizeExceededException e) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        "ARCHIVO_DEMASIADO_GRANDE",
                        "El archivo supera el tamaño máximo permitido de "
                                + ArchivoService.TAMANO_MAXIMO_MB + " MB"
                ));
    }

    // VALIDACIONES DE DTO
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException e) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        "DATOS_INVALIDOS",
                        "Los datos enviados no son válidos"
                ));
    }
    
    // PARÁMETROS CON FORMATO INVÁLIDO (ej. un id que no es UUID)
    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class,
            MissingServletRequestPartException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            Exception e) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        "DATOS_INVALIDOS",
                        "Los datos enviados no son válidos"
                ));
    }

    // EDICIONES SIMULTÁNEAS (informe de carga 4.2): si dos guardados del mismo dato chocan en la
    // base (bloqueo que no se consiguió a tiempo, deadlock o versión desactualizada), la persona
    // recibe un 409 que puede resolver reintentando, no un 500.
    @ExceptionHandler({
            PessimisticLockingFailureException.class,
            OptimisticLockingFailureException.class
    })
    public ResponseEntity<ErrorResponse> handleConflictoDeEdicion(
            Exception e) {

        log.warn("Edición en conflicto: {}", e.getClass().getSimpleName());

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(
                        "EDICION_EN_CONFLICTO",
                        "Este contenido se acaba de guardar desde otro lado. Revisá los cambios y volvé a intentar"
                ));
    }

    // ERRORES INESPERADOS
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(
            Exception e) {

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        "ERROR_INTERNO",
                        "Ocurrió un error inesperado"
                ));
    }
}
