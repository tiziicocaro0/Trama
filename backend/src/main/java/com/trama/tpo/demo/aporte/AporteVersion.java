package com.trama.tpo.demo.aporte;

import com.trama.tpo.demo.entity.usuario.Usuario;
import com.trama.tpo.demo.config.CifradoConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * Copia de un aporte antes de una edición (3.2).
 * Una versión guardada no se modifica nunca: no tiene setters y
 * ninguna columna se actualiza.
 */
@Entity
@Table(name = "aporte_version")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AporteVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aporte_id", nullable = false, updatable = false)
    private Aporte aporte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false, updatable = false)
    private Usuario autor;

    @Column(name = "titulo", nullable = false, length = 150, updatable = false)
    private String titulo;

    @Convert(converter = CifradoConverter.class)
    @Column(name = "contenido", columnDefinition = "MEDIUMBLOB", updatable = false)
    private String contenido;

    @Convert(converter = CifradoConverter.class)
    @Column(name = "datos", columnDefinition = "MEDIUMBLOB", updatable = false)
    private String datos;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;
}
