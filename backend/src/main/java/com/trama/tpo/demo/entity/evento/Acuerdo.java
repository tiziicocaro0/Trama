package com.trama.tpo.demo.entity.evento;

import com.trama.tpo.demo.config.CifradoConverter;
import com.trama.tpo.demo.entity.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Un acuerdo de una reunión, con responsable y fecha de revisión (5.6). */
@Entity
@Table(name = "acuerdo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Acuerdo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    // Un evento de tipo REUNION (lo valida AcuerdoService)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reunion_id", nullable = false)
    private Evento reunion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsable_id", nullable = false)
    private Usuario responsable;

    @Convert(converter = CifradoConverter.class)
    @Column(name = "descripcion", nullable = false, columnDefinition = "VARBINARY(4096)")
    private String descripcion;

    @Column(name = "fecha_revision", nullable = false)
    private LocalDate fechaRevision;

    @Builder.Default
    @Column(name = "cumplido", nullable = false)
    private Boolean cumplido = false;

    // Cuándo se avisó que venció: evita avisar dos veces
    @Column(name = "avisado_en")
    private Instant avisadoEn;
}
