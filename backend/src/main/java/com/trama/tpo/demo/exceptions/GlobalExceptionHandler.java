package com.trama.tpo.demo.exceptions;

import com.trama.tpo.demo.service.ArchivoService;
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
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

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
    // ERRORES HTTP CONTROLADOS
        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<ErrorResponse> handleResponseStatus(
                ResponseStatusException e) {

        return ResponseEntity
                .status(e.getStatusCode())
                .body(new ErrorResponse(
                        "DATOS_INVALIDOS",
                        e.getReason() != null
                                ? e.getReason()
                                : "No se pudo completar la solicitud"
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
