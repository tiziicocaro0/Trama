package com.trama.tpo.demo.entity.membresia;

/**
 * Especialidades disponibles para profesionales de EDUCACION y SALUD.
 * Cada valor conoce el rol al que pertenece para validar coherencia.
 */
public enum Especialidad {

    // ── EDUCACIÓN ─────────────────────────────────────────────
    DOCENTE_PRIMARIO(Rol.EDUCACION),
    DOCENTE_SECUNDARIO(Rol.EDUCACION),
    DOCENTE_EDUCACION_ESPECIAL(Rol.EDUCACION),
    MAESTRO_NIVEL_INICIAL(Rol.EDUCACION),
    MAESTRA_INTEGRADORA(Rol.EDUCACION),
    EQUIPO_ORIENTACION(Rol.EDUCACION),
    PRECEPTOR_ESCOLAR(Rol.EDUCACION),
    DIRECTOR_ESCUELA(Rol.EDUCACION),
    ASISTENTE_EDUCACIONAL(Rol.EDUCACION),
    INSPECTOR(Rol.EDUCACION),
    OTRA_EDUCACION(Rol.EDUCACION),

    // ── SALUD ─────────────────────────────────────────────────
    PSICOLOGIA(Rol.SALUD),
    PSICOPEDAGOGIA(Rol.SALUD),
    FONOAUDIOLOGIA(Rol.SALUD),
    LOGOPEDA(Rol.SALUD),
    TERAPIA_OCUPACIONAL(Rol.SALUD),
    ACOMPANANTE_TERAPEUTICO(Rol.SALUD),
    PSIQUIATRIA(Rol.SALUD),
    PSIQUIATRIA_INFANTO_JUVENIL(Rol.SALUD),
    PEDIATRIA(Rol.SALUD),
    GENETISTA(Rol.SALUD),
    PSICOLOGO_SOCIAL(Rol.SALUD),
    TRABAJADOR_SOCIAL(Rol.SALUD),
    OTRA_SALUD(Rol.SALUD);

    private final Rol rol;

    Especialidad(Rol rol) {
        this.rol = rol;
    }

    /** Rol al que pertenece esta especialidad (EDUCACION o SALUD). */
    public Rol getRol() {
        return rol;
    }
}
