package com.trama.tpo.demo.entity.plan;

import java.math.BigDecimal;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import lombok.*;

/** 9.2: paquete institucional. Cupo null = sin límite. Los carga la migración (son fijos). */
@Entity
@Table(name = "paquete")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paquete {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 40)
    private String nombre;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "cupo_ninos")
    private Integer cupoNinos;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "cupo_profesionales")
    private Integer cupoProfesionales;

    @Column(name = "precio", nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    /** true si la cantidad supera el cupo (un cupo null nunca se supera). */
    public static boolean supera(Integer cupo, long cantidad) {
        return cupo != null && cantidad > cupo;
    }
}
