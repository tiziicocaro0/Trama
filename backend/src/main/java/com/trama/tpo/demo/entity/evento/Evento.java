package com.trama.tpo.demo.entity.evento;

import com.trama.tpo.demo.config.CifradoConverter;
import com.trama.tpo.demo.entity.archivo.Archivo;
import com.trama.tpo.demo.entity.proyecto.Proyecto;
import com.trama.tpo.demo.entity.usuario.Usuario;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "evento")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proyecto_id", nullable = false)
    private Proyecto proyecto;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "imagen_id")
    private Archivo imagen;

    @Builder.Default
    @Column(name = "tipo", nullable = false, length = 10)
    private String tipo = "COMUN";

    @Column(name = "titulo", nullable = false, length = 150)
    private String titulo;

    @Convert(converter = CifradoConverter.class)
    @Column(name = "descripcion", columnDefinition = "VARBINARY(4096)")
    private String descripcion;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "hora_inicio")
    private LocalTime horaInicio;

    @Column(name = "hora_fin")
    private LocalTime horaFin;

    @Builder.Default
    @Column(name = "recurrente", nullable = false)
    private Boolean recurrente = false;

    @Column(name = "dia_semana", columnDefinition = "TINYINT")
    private Byte diaSemana;

    @Column(name = "fecha_fin_recurrencia")
    private LocalDate fechaFinRecurrencia;

    @Builder.Default
    @Column(name = "es_cambio", nullable = false)
    private Boolean esCambio = false;

    @Column(name = "acta", columnDefinition = "MEDIUMBLOB")
    private byte[] acta;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;
}