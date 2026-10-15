package com.trama.tpo.demo.entity.proyecto;

import com.trama.tpo.demo.entity.usuario.Usuario;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** El perfil de un niño (1.2). */
@Entity
@Table(name = "proyecto")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Proyecto {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 80)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 80)
    private String apellido;

    @Column(name = "apodo", length = 40)
    private String apodo;

    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    @Column(name = "escuela", nullable = false, length = 120)
    private String escuela;

    @Column(name = "grado", nullable = false, length = 30)
    private String grado;

    /**
     * Id del archivo de la foto. Queda como id suelto hasta que exista la entity Archivo (0.3, S2);
     * ahí se cambia por un @ManyToOne(fetch = LAZY) sin tocar la base.
     */
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "foto_archivo_id", columnDefinition = "BINARY(16)")
    private UUID fotoArchivoId;

    @Column(name = "consentimiento_fecha", nullable = false)
    private Instant consentimientoFecha;

    /** 1.8 */
    @Builder.Default
    @Column(name = "familiar_puede_cargar", nullable = false)
    private Boolean familiarPuedeCargar = true;

    /** 1.8 */
    @Builder.Default
    @Column(name = "familiar_ve_notas", nullable = false)
    private Boolean familiarVeNotas = false;

    /** 8.2: NULL = nadie pidió eliminarlo. */
    @Column(name = "eliminacion_programada")
    private Instant eliminacionProgramada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "eliminacion_pedida_por")
    private Usuario eliminacionPedidaPor;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;
}
