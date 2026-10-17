package com.trama.tpo.demo.aporte;

import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.trama.tpo.demo.common.CifradoConverter;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "aporte_version")
@Getter @Setter @NoArgsConstructor
public class AporteVersion {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY) @Column(columnDefinition = "BINARY(16)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.BINARY) @Column(name = "aporte_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID aporteId;

    @JdbcTypeCode(SqlTypes.BINARY) @Column(name = "autor_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID autorId;

    @Column(nullable = false, length = 150)
    private String titulo;

    @Lob @Convert(converter = CifradoConverter.class) @Column(columnDefinition = "MEDIUMBLOB")
    private String contenido;

    @Lob @Convert(converter = CifradoConverter.class) @Column(columnDefinition = "MEDIUMBLOB")
    private String datos;

    @Column(name = "creado_en", nullable = false)
    private Instant creadoEn;
}
