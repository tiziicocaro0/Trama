package com.trama.tpo.demo.entity.membresia;

import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Qué rol tiene un usuario en un proyecto. Un solo rol por niño (uq_membresia_usuario_proyecto).
 * La base rechaza es_admin = true si el rol no es TUTOR.
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

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "rol", nullable = false, length = 12)
    private Rol rol;

    @Builder.Default
    @Column(name = "es_admin", nullable = false)
    private Boolean esAdmin = false;

    /** 1.9: especialidades declaradas (solo EDUCACION o SALUD). */
    @Builder.Default
    @OneToMany(mappedBy = "membresia", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MembresiaEspecialidad> especialidades = new ArrayList<>();

    @Column(name = "matricula", length = 40)
    private String matricula;

    @CreationTimestamp
    @Column(name = "fecha_alta", nullable = false, updatable = false)
    private Instant fechaAlta;
}
