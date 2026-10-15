package com.trama.tpo.demo.exceptions;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {

    private final String codigo;
    private final HttpStatus estado;

    public ApiException(
            String codigo,
            String mensaje,
            HttpStatus estado) {

        super(mensaje);
        this.codigo = codigo;
        this.estado = estado;
    }

    public String getCodigo() {
        return codigo;
    }

    public HttpStatus getEstado() {
        return estado;
    }
}