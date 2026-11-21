package com.trama.tpo.demo.exceptions;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.trama.tpo.demo.service.ArchivoService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
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

    /**
     * Cuerpo de todo error de la API. `campos` solo viene en los errores de validación y
     * `seguimiento` solo en los 500: es el código con el que ese error aparece en el log.
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorResponse(
            String codigo,
            String mensaje,
            List<CampoInvalido> campos,
            String seguimiento
    ) {
        public ErrorResponse(String codigo, String mensaje) {
            this(codigo, mensaje, null, null);
        }
    }

    /** Un dato del pedido que no pasó la validación, y por qué. */
    public record CampoInvalido(String campo, String mensaje) {}

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

    // VALIDACIONES DE DTO: qué campos fallaron y por qué
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException e) {

        List<CampoInvalido> campos = MensajesDeError.camposInvalidos(e);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        "DATOS_INVALIDOS",
                        MensajesDeError.resumen(campos),
                        campos,
                        null
                ));
    }

    // CUERPO ILEGIBLE: JSON mal formado, un valor que no es del tipo esperado o un enum inexistente
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleCuerpoIlegible(
            HttpMessageNotReadableException e) {

        return datosInvalidos(MensajesDeError.cuerpoIlegible(e));
    }

    // PARÁMETRO CON FORMATO INVÁLIDO (por ejemplo, un id que no es UUID)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException e) {

        return datosInvalidos(MensajesDeError.parametroInvalido(e));
    }

    // FALTA UN PARÁMETRO OBLIGATORIO
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleParametroFaltante(
            MissingServletRequestParameterException e) {

        return datosInvalidos("Falta el parámetro obligatorio \"" + e.getParameterName() + "\"");
    }

    // FALTA EL ARCHIVO U OTRA PARTE DE UN FORMULARIO MULTIPART
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleParteFaltante(
            MissingServletRequestPartException e) {

        return datosInvalidos("Falta \"" + e.getRequestPartName() + "\" en el formulario");
    }

    // MÉTODO HTTP NO PERMITIDO EN ESA RUTA (antes caía en el 500)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMetodoNoPermitido(
            HttpRequestMethodNotSupportedException e) {

        String permitidos = e.getSupportedHttpMethods() == null ? ""
                : ". Se acepta: " + String.join(", ",
                        e.getSupportedHttpMethods().stream().map(Object::toString).toList());

        return ResponseEntity
                .status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(new ErrorResponse(
                        "METODO_NO_PERMITIDO",
                        "Esta ruta no acepta " + e.getMethod() + permitidos
                ));
    }

    // TIPO DE CONTENIDO NO SOPORTADO (antes caía en el 500)
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleTipoNoSoportado(
            HttpMediaTypeNotSupportedException e) {

        String recibido = e.getContentType() == null ? "sin tipo" : e.getContentType().toString();
        String esperado = e.getSupportedMediaTypes().isEmpty() ? "" : ". Se espera: " + String.join(", ",
                e.getSupportedMediaTypes().stream().map(Object::toString).toList());

        return ResponseEntity
                .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ErrorResponse(
                        "TIPO_NO_SOPORTADO",
                        "El tipo de contenido " + recibido + " no está soportado" + esperado
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

    // ERRORES INESPERADOS (hallazgo C3 del informe de carga): antes se devolvía un 500 sin dejar
    // rastro. Ahora el error completo queda en el log con un código de seguimiento, y la respuesta
    // solo lleva ese código: nunca la traza ni el mensaje interno, que expondrían cómo funciona el back.
    // Del pedido se registran el método y la ruta, sin el cuerpo ni la consulta (pueden tener datos del niño).
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(
            Exception e,
            HttpServletRequest request) {

        // Excepciones propias de Spring que ya traen un 4xx (por ejemplo 406): se respeta su estado.
        if (e instanceof org.springframework.web.ErrorResponse respuestaHttp
                && respuestaHttp.getStatusCode().is4xxClientError()) {
            return ResponseEntity
                    .status(respuestaHttp.getStatusCode())
                    .body(new ErrorResponse(
                            "PEDIDO_INVALIDO",
                            "El pedido no se pudo procesar (" + respuestaHttp.getStatusCode().value() + ")"
                    ));
        }

        String seguimiento = UUID.randomUUID().toString().substring(0, 8);

        log.error("Error inesperado [{}] en {} {}",
                seguimiento, request.getMethod(), request.getRequestURI(), e);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        "ERROR_INTERNO",
                        "Ocurrió un error inesperado. Si se repite, avisanos con este código: " + seguimiento,
                        null,
                        seguimiento
                ));
    }

    private ResponseEntity<ErrorResponse> datosInvalidos(String mensaje) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("DATOS_INVALIDOS", mensaje));
    }
}
