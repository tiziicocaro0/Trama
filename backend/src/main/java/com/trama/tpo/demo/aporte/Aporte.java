package com.trama.tpo.demo.aporte;

import com.trama.tpo.demo.config.CifradoConverter;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "aporte")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Aporte {

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

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private TipoAporte tipo;

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    // Contenido cifrado (historia 0.20)
    @Convert(converter = CifradoConverter.class)
    @Column(name = "contenido", columnDefinition = "MEDIUMBLOB")
    private String contenido;

    // Datos JSON cifrados (historia 0.20)
    @Convert(converter = CifradoConverter.class)
    @Column(name = "datos", columnDefinition = "MEDIUMBLOB")
    private String datos;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "visibilidad", nullable = false, length = 15)
    private Visibilidad visibilidad = Visibilidad.TODOS;

    @Builder.Default
    @Column(name = "archivado", nullable = false)
    private Boolean archivado = false;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "aporte_archivo",
            joinColumns = @JoinColumn(name = "aporte_id"),
            inverseJoinColumns = @JoinColumn(name = "archivo_id")
    )
    private List<Archivo> archivos = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;
}
