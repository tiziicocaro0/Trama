package com.trama.tpo.demo.entity.usuario;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usuario")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 80)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 80)
    private String apellido;

    @Column(name = "email", nullable = false, unique = true, length = 254)
    private String email;

    /** Hash BCrypt, nunca la contraseña. */
    @Column(name = "password_hash", nullable = false, columnDefinition = "CHAR(60)")
    private String passwordHash;

    /** 1.1: a los 5 intentos se bloquea la cuenta. */
    @Builder.Default
    @JdbcTypeCode(SqlTypes.TINYINT)
    @Column(name = "intentos_fallidos", nullable = false)
    private Integer intentosFallidos = 0;

    @Column(name = "bloqueado_hasta")
    private Instant bloqueadoHasta;

    /** Va dentro del JWT; al sumarle 1, todos los tokens anteriores dejan de valer. */
    @Builder.Default
    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 0;

    /** 9.4: cómo usa Trama (familia o profesional). No da permisos sobre ningún niño. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "tipo_cuenta", nullable = false, length = 12)
    private TipoCuenta tipoCuenta = TipoCuenta.FAMILIA;

    /** Registro: la cuenta entra recién después de confirmar el código que llega por mail. */
    @Builder.Default
    @Column(name = "email_verificado", nullable = false)
    private Boolean emailVerificado = true;

    /** Cuando la persona se registró en TRAMA. */
    @CreationTimestamp
    @Column(name = "fecha_alta", nullable = false, updatable = false)
    private Instant fechaAlta;
}
