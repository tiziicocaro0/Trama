package com.trama.tpo.demo.entity.plan;

import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import lombok.*;

/**
 * 9.2: institución que contrató un paquete. Su responsable asocia profesionales,
 * pero no tiene acceso a ningún proyecto: no hay relación con los niños.
 */
@Entity
@Table(name = "institucion")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Institucion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "paquete_id", nullable = false)
    private Paquete paquete;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "responsable_id", columnDefinition = "BINARY(16)", nullable = false, updatable = false)
    private UUID responsableId;

    @Column(name = "nombre", nullable = false, length = 120)
    private String nombre;
}
