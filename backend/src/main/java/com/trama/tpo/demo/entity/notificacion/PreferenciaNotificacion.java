package com.trama.tpo.demo.entity.notificacion;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.io.Serializable;
import java.util.UUID;

/**
 * 6.1: si el usuario quiere recibir por mail un tipo de notificación.
 * Sin fila, vale el valor por defecto de la tabla (por_email = TRUE).
 */
@Entity
@Table(name = "preferencia_notificacion")
@IdClass(PreferenciaNotificacion.Clave.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PreferenciaNotificacion {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "usuario_id", columnDefinition = "BINARY(16)")
    private UUID usuarioId;

    @Id
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "tipo", length = 20)
    private TipoNotificacion tipo;

    @Column(name = "por_email", nullable = false)
    private Boolean porEmail;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class Clave implements Serializable {
        private UUID usuarioId;
        private TipoNotificacion tipo;
    }
}
