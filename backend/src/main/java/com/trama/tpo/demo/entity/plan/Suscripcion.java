package com.trama.tpo.demo.entity.plan;

import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import lombok.*;

/**
 * Suscripción del profesional (9.0, 9.1). Una por usuario: la clave es el usuario_id.
 * Mientras esté activa y vigente, el profesional edita en todos sus niños.
 * El pago es simulado: no se guarda ningún dato de tarjeta.
 */
@Entity
@Table(name = "suscripcion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Suscripcion {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "usuario_id", columnDefinition = "BINARY(16)")
    private UUID usuarioId;

    @Builder.Default
    @Column(name = "activa", nullable = false)
    private Boolean activa = true;

    @Column(name = "desde", nullable = false)
    private LocalDate desde;

    /** 9.1: mensual o semestral. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "periodo", nullable = false, length = 10)
    private PeriodoSuscripcion periodo = PeriodoSuscripcion.MENSUAL;

    /** Hasta cuándo está pagada; null = sin vencimiento. */
    @Column(name = "hasta")
    private LocalDate hasta;

    /** Activa y no vencida a la fecha indicada. */
    public boolean vigenteEn(LocalDate fecha) {
        return Boolean.TRUE.equals(activa) && (hasta == null || !hasta.isBefore(fecha));
    }
}
