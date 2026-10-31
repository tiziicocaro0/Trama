package com.trama.tpo.demo.aporte;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

/** Clave de una confirmación: una por persona por aporte (3.3). */
@Embeddable
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmacionAporteId implements Serializable {

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "aporte_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID aporteId;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "usuario_id", columnDefinition = "BINARY(16)", nullable = false)
    private UUID usuarioId;

    @Override
    public boolean equals(Object otro) {
        return otro instanceof ConfirmacionAporteId o
                && Objects.equals(aporteId, o.aporteId)
                && Objects.equals(usuarioId, o.usuarioId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(aporteId, usuarioId);
    }
}
