package com.trama.backend.membresia;

import com.trama.backend.proyecto.Proyecto;
import com.trama.backend.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Qué rol tiene un usuario en un proyecto. Un solo rol por niño (uq_membresia_usuario_proyecto).
 * La base rechaza es_admin = true si el rol no es TUTOR, y especialidad si no es EDUCACION o SALUD.
 */
@Entity
@Table(name = "membresia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Membresia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proyecto_id", nullable = false)
    private Proyecto proyecto;

    // La columna es VARCHAR + CHECK, no un ENUM nativo de MySQL (que es lo que Hibernate 6 generaría por defecto)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "rol", nullable = false, length = 12)
    private Rol rol;

    @Builder.Default
    @Column(name = "es_admin", nullable = false)
    private Boolean esAdmin = false;

    /** 1.9: solo EDUCACION o SALUD. Ej.: DOCENTE, PSICOLOGIA. */
    @Column(name = "especialidad", length = 30)
    private String especialidad;

    @Column(name = "matricula", length = 40)
    private String matricula;

    /** Cuando el usuario se sumó a este niño. */
    @CreationTimestamp
    @Column(name = "fecha_alta", nullable = false, updatable = false)
    private Instant fechaAlta;
}
