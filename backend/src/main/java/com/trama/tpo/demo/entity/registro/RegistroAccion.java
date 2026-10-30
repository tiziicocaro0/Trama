package com.trama.tpo.demo.entity.registro;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import lombok.*;

/**
 * Quién hizo qué, sobre qué sección y cuándo (0.2). Sin contenido sensible.
 * Es inmutable: no tiene setters y ninguna columna se actualiza.
 */
@Entity
@Table(name = "registro_accion")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroAccion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "usuario_id", columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID usuarioId;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "proyecto_id", columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID proyectoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "accion", nullable = false, length = 10, updatable = false)
    private AccionRegistro accion;

    @Column(name = "seccion", nullable = false, length = 30, updatable = false)
    private String seccion;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private Instant fecha;
}
