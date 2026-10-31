package com.trama.tpo.demo.entity.usuario;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Código de 6 dígitos para verificar el email de una cuenta nueva (uno vigente por usuario). */
@Entity
@Table(name = "codigo_verificacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodigoVerificacion {

    @Id
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "usuario_id", columnDefinition = "BINARY(16)")
    private UUID usuarioId;

    /** SHA-256 de usuario + código: el código nunca se guarda. */
    @Column(name = "codigo_hash", nullable = false, columnDefinition = "CHAR(64)")
    private String codigoHash;

    @Column(name = "vence_en", nullable = false)
    private Instant venceEn;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(name = "intentos", nullable = false)
    private Integer intentos = 0;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;
}
