package com.trama.tpo.demo.entity.membresia;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

/**
 * Una especialidad declarada por un profesional en una membresía.
 * Un miembro puede tener varias (multi-selección).
 */
@Entity
@Table(name = "membresia_especialidad")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MembresiaEspecialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "membresia_id", nullable = false)
    private Membresia membresia;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "especialidad", nullable = false, length = 40)
    private Especialidad especialidad;

    /** Subtítulo profesional opcional. Ej.: "Profesora de matemáticas". */
    @Column(name = "aclaracion", length = 120)
    private String aclaracion;
}
