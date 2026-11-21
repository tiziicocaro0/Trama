package com.trama.tpo.demo.exceptions;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.fasterxml.jackson.databind.exc.MismatchedInputException;
import com.fasterxml.jackson.databind.exc.UnrecognizedPropertyException;
import com.trama.tpo.demo.exceptions.GlobalExceptionHandler.CampoInvalido;

/**
 * Arma los mensajes de los errores 400 para que digan qué falló y qué se esperaba, en lugar de un
 * genérico "los datos no son válidos". Nunca incluye detalles internos (clases, SQL, trazas): eso
 * queda solo en el log.
 */
final class MensajesDeError {

    private static final int LARGO_MAXIMO_VALOR = 40;

    private MensajesDeError() {
    }

    static List<CampoInvalido> camposInvalidos(MethodArgumentNotValidException e) {
        List<CampoInvalido> campos = e.getBindingResult().getFieldErrors().stream()
                .map(error -> new CampoInvalido(error.getField(), motivo(error)))
                .collect(Collectors.toList());

        // Validaciones de todo el objeto (por ejemplo, "las contraseñas no coinciden")
        e.getBindingResult().getGlobalErrors().forEach(error ->
                campos.add(new CampoInvalido(error.getObjectName(), error.getDefaultMessage())));

        return campos;
    }

    static String resumen(List<CampoInvalido> campos) {
        if (campos.isEmpty()) {
            return "Los datos enviados no son válidos";
        }
        return "Revisá estos datos: " + campos.stream()
                .map(MensajesDeError::frase)
                .collect(Collectors.joining(". "));
    }

    // Los DTO ya traen mensajes completos ("El nombre es obligatorio"); los genéricos de Bean
    // Validation empiezan en minúscula ("no debe estar vacío") y necesitan el nombre del campo.
    private static String frase(CampoInvalido campo) {
        String mensaje = campo.mensaje();
        boolean esFraseCompleta = !mensaje.isEmpty() && Character.isUpperCase(mensaje.charAt(0));
        return esFraseCompleta ? mensaje : campo.campo() + ": " + mensaje;
    }

    static String cuerpoIlegible(HttpMessageNotReadableException e) {
        Throwable causa = e.getCause();

        if (causa instanceof InvalidFormatException formato) {
            String campo = ruta(formato);
            Class<?> esperado = formato.getTargetType();
            if (esperado != null && esperado.isEnum()) {
                return "El valor \"" + recortar(formato.getValue()) + "\" no es válido para " + campo
                        + ". Valores posibles: " + Arrays.stream(esperado.getEnumConstants())
                        .map(Object::toString).collect(Collectors.joining(", "));
            }
            return "El valor \"" + recortar(formato.getValue()) + "\" no es válido para " + campo
                    + ": se esperaba " + descripcion(esperado);
        }
        if (causa instanceof UnrecognizedPropertyException propiedad) {
            return "El campo \"" + propiedad.getPropertyName() + "\" no se reconoce";
        }
        if (causa instanceof MismatchedInputException entrada && !entrada.getPath().isEmpty()) {
            return "El campo " + ruta(entrada) + " tiene un tipo incorrecto: se esperaba "
                    + descripcion(entrada.getTargetType());
        }
        return "El cuerpo del pedido no es un JSON válido o está vacío";
    }

    static String parametroInvalido(MethodArgumentTypeMismatchException e) {
        return "El parámetro \"" + e.getName() + "\" no es válido: se esperaba "
                + descripcion(e.getRequiredType());
    }

    private static String motivo(FieldError error) {
        String mensaje = error.getDefaultMessage();
        return mensaje == null || mensaje.isBlank() ? "no es válido" : mensaje;
    }

    private static String ruta(JsonMappingException e) {
        String ruta = e.getPath().stream()
                .map(r -> r.getFieldName() != null ? r.getFieldName() : "[" + r.getIndex() + "]")
                .collect(Collectors.joining("."))
                .replace(".[", "[");
        return ruta.isEmpty() ? "el cuerpo del pedido" : "\"" + ruta + "\"";
    }

    private static String descripcion(Class<?> tipo) {
        if (tipo == null) {
            return "otro formato";
        }
        if (tipo == UUID.class) {
            return "un identificador (UUID)";
        }
        if (tipo == LocalDate.class) {
            return "una fecha con formato AAAA-MM-DD";
        }
        if (tipo == LocalDateTime.class) {
            return "una fecha y hora con formato AAAA-MM-DDTHH:MM";
        }
        if (tipo == LocalTime.class) {
            return "una hora con formato HH:MM";
        }
        if (tipo == Boolean.class || tipo == boolean.class) {
            return "true o false";
        }
        if (Number.class.isAssignableFrom(tipo) || tipo == int.class || tipo == long.class) {
            return "un número";
        }
        if (tipo.isEnum()) {
            return "uno de estos valores: " + Arrays.stream(tipo.getEnumConstants())
                    .map(Object::toString).collect(Collectors.joining(", "));
        }
        if (tipo == String.class) {
            return "un texto";
        }
        if (List.class.isAssignableFrom(tipo) || tipo.isArray()) {
            return "una lista";
        }
        return "otro formato";
    }

    // El valor lo mandó el propio cliente; se recorta para que la respuesta no crezca sin límite.
    private static String recortar(Object valor) {
        String texto = String.valueOf(valor);
        return texto.length() <= LARGO_MAXIMO_VALOR ? texto : texto.substring(0, LARGO_MAXIMO_VALOR) + "…";
    }
}
