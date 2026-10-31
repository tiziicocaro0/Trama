package com.trama.tpo.demo.aporte;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** "Yo también lo observé": alguien refuerza un aporte ajeno sin modificarlo (3.3). */
@Entity
@Table(name = "confirmacion_aporte")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmacionAporte {

    @EmbeddedId
    private ConfirmacionAporteId id;

    @CreationTimestamp
    @Column(name = "fecha", nullable = false, updatable = false)
    private Instant fecha;
}
