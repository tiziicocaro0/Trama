package com.trama.tpo.demo.aporte;

import com.trama.tpo.demo.entity.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "aporte_version")
@Getter
@Setter
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
    @JoinColumn(name = "aporte_id", nullable = false)
    private Aporte aporte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    // Los campos contenido y datos se integrarán
    // cuando esté disponible CifradoConverter (historia 0.20).

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;
}