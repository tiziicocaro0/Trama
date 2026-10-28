package com.trama.tpo.demo.entity.archivo;

import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "archivo")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Archivo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proyecto_id", nullable = false)
    private Proyecto proyecto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @Column(name = "nombre_original", nullable = false, length = 255)
    private String nombreOriginal;

    @Column(name = "tipo_mime", nullable = false, length = 20)
    private String tipoMime;

    @JdbcTypeCode(SqlTypes.INTEGER)
    @Column(name = "tamano_bytes", nullable = false, columnDefinition = "INT UNSIGNED")
    private Long tamanoBytes;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "ruta", nullable = false, unique = true, columnDefinition = "CHAR(36)")
    private String ruta;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private Instant fecha;
}
