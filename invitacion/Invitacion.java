package com.trama.backend.invitacion;

import com.trama.backend.membresia.Rol;
import com.trama.backend.proyecto.Proyecto;
import com.trama.backend.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/** 1.3 / 1.4: se guarda el SHA-256 del token; el token en claro solo viaja en el link. */
@Entity
@Table(name = "invitacion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invitacion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proyecto_id", nullable = false)
    private Proyecto proyecto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invitado_por", nullable = false)
    private Usuario invitadoPor;

    @Column(name = "email", nullable = false, length = 254)
    private String email;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "rol", nullable = false, length = 12)
    private Rol rol;

    @Column(name = "token_hash", nullable = false, unique = true, columnDefinition = "CHAR(64)")
    private String tokenHash;

    /** Creado + 7 días. */
    @Column(name = "vence_en", nullable = false)
    private Instant venceEn;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "estado", nullable = false, length = 10)
    private EstadoInvitacion estado = EstadoInvitacion.PENDIENTE;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;
}
