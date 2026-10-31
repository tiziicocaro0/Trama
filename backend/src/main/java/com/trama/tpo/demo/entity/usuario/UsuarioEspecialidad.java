package com.trama.tpo.demo.entity.usuario;

import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.trama.tpo.demo.entity.membresia.Especialidad;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 9.4: especialidad que un profesional declara en su cuenta.
 * Sirve para precargar las especialidades al sumarse a cada niño.
 */
@Entity
@Table(name = "usuario_especialidad")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioEspecialidad {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(name = "usuario_id", nullable = false, columnDefinition = "BINARY(16)")
    private UUID usuarioId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "especialidad", nullable = false, length = 40)
    private Especialidad especialidad;

    /** Subtítulo opcional; obligatorio para OTRA_EDUCACION y OTRA_SALUD. */
    @Column(name = "aclaracion", length = 120)
    private String aclaracion;
}
