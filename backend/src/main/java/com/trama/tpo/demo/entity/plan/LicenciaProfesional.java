package com.trama.tpo.demo.entity.plan;

import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.trama.tpo.demo.entity.usuario.Usuario;

import jakarta.persistence.*;
import lombok.*;

/** 9.2: un profesional cubierto por la licencia de una institución (no consume su límite gratuito). */
@Entity
@Table(name = "licencia_profesional")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LicenciaProfesional {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "institucion_id", nullable = false)
    private Institucion institucion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "desde", nullable = false)
    private LocalDate desde;

    /** null = vigente. Al quitar al profesional se borra la licencia. */
    @Column(name = "hasta")
    private LocalDate hasta;
}
