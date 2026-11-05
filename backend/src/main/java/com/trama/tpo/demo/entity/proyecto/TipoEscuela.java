package com.trama.tpo.demo.entity.proyecto;

/**
 * A qué tipo de escuela va el niño. HIBRIDA: concurre a una común y a una especial.
 * Es opcional porque los perfiles creados antes no lo tienen; el front lo pide al crear.
 */
public enum TipoEscuela {
    COMUN,
    ESPECIAL,
    HIBRIDA
}
