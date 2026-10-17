package com.trama.tpo.demo.aporte;

import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.trama.tpo.demo.common.CifradoConverter;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "aporte")
@Getter @Setter @NoArgsConstructor
public class Aporte {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY) @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.BINARY) @Column(name = "proyecto_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID proyectoId;

    @JdbcTypeCode(SqlTypes.BINARY) @Column(name = "autor_id", nullable = false, updatable = false, columnDefinition = "BINARY(16)")
    private UUID autorId;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 30)
    private TipoAporte tipo;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Lob @Convert(converter = CifradoConverter.class) @Column(columnDefinition = "MEDIUMBLOB")
    private String contenido;

    @Lob @Convert(converter = CifradoConverter.class) @Column(columnDefinition = "MEDIUMBLOB")
    private String datos;

    @Enumerated(EnumType.STRING) @JdbcTypeCode(SqlTypes.VARCHAR) @Column(nullable = false, length = 15)
    private Visibilidad visibilidad;

    @Column(nullable = false)
    private boolean archivado;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;
}
