package com.trama.datosprueba;

import static com.trama.datosprueba.ArchivosDePrueba.AGUA;
import static com.trama.datosprueba.ArchivosDePrueba.MIEL;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

import com.trama.tpo.demo.entity.usuario.Usuario;

// El calendario de Valen: actividades semanales, cambios de rutina y reuniones de equipo
// (una ya hecha, con su acta, y otra por venir). Todo con fechas relativas a hoy.
final class EventosDeValen {

    private static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    private final CargadorDatosDePrueba c;
    private final UUID id;
    private final Usuario laura, pablo, elena, maria, diego, sofia;
    private final LocalDate hoy = LocalDate.now(ZONA);

    EventosDeValen(CargadorDatosDePrueba cargador, UUID proyectoId, Usuario laura, Usuario pablo,
            Usuario elena, Usuario maria, Usuario diego, Usuario sofia) {
        this.c = cargador;
        this.id = proyectoId;
        this.laura = laura;
        this.pablo = pablo;
        this.elena = elena;
        this.maria = maria;
        this.diego = diego;
        this.sofia = sofia;
    }

    void cargar() {
        semanales();
        cambiosYTurnos();
        reuniones();
    }

    // Se repiten todas las semanas desde hace dos meses
    private void semanales() {
        UUID terapia = c.imagen(sofia, id, "ir-a-terapia.png", "Vamos a terapia",
                new String[] {"Mochila", "Auto", "Saludar", "Jugar"}, AGUA, null);
        c.evento(sofia, id, "Terapia ocupacional", "Sesión con Sofía en el consultorio.",
                desde(DayOfWeek.TUESDAY), hora(16, 0), hora(17, 0), true, false, terapia, null);

        UUID natacion = c.imagen(pablo, id, "natacion.png", "Natación",
                new String[] {"Malla", "Gorra", "Ducha", "Pileta"}, MIEL, null);
        c.evento(pablo, id, "Natación", "Clase en el club. Llevar la gorra y las ojotas.",
                desde(DayOfWeek.WEDNESDAY), hora(18, 0), hora(19, 0), true, false, natacion, null);

        c.evento(diego, id, "Psicología", "Sesión semanal con Diego.",
                desde(DayOfWeek.THURSDAY), hora(17, 30), hora(18, 15), true, false, null, null);

        c.evento(elena, id, "Merienda con la abuela", "Después de la escuela la busca Elena.",
                desde(DayOfWeek.FRIDAY), hora(16, 30), hora(18, 30), true, false, null, null);
    }

    // Cosas que cambian la rutina (se avisan a la red) y turnos sueltos
    private void cambiosYTurnos() {
        c.evento(maria, id, "Acto escolar", "Ensayamos el lunes. Puede usar los auriculares.",
                hoy.plusDays(4), hora(10, 0), hora(11, 30), false, true, null, null);
        c.evento(maria, id, "Sin clases: jornada docente", "Ese día no hay escuela.",
                hoy.plusDays(11), hora(8, 0), hora(12, 30), false, true, null, null);
        c.evento(laura, id, "Control con la pediatra", "Llevar la libreta de vacunas.",
                hoy.plusDays(6), hora(15, 30), hora(16, 15), false, false, null, null);
        c.evento(elena, id, "Cumpleaños de la abuela", "Festejo en casa de Elena.",
                hoy.plusDays(2), hora(17, 0), hora(20, 0), false, false, null, null);
        c.evento(pablo, id, "Cambio de horario en natación", "Esta semana la clase es a las 17.",
                hoy.minusDays(5), hora(17, 0), hora(18, 0), false, true, null, null);
    }

    private void reuniones() {
        List<UUID> equipo = List.of(laura.getId(), maria.getId(), diego.getId(), sofia.getId());

        UUID pasada = c.evento(laura, id, "Reunión de equipo", "Repaso del trimestre y del acto escolar.",
                hoy.minusDays(12), hora(18, 0), hora(19, 0), false, false, null, equipo);
        c.acta(laura, id, pasada, """
                Participaron Laura, María, Diego y Sofía.
                - La agenda visual funciona en casa, en la escuela y en el consultorio: la seguimos usando en los tres lugares.
                - Para el acto escolar: ensayar antes, ubicarla cerca de la salida y llevar los auriculares.
                - Diego comparte las pautas para las vacaciones en Notas.
                Próxima reunión en un mes.""");

        c.evento(maria, id, "Reunión con la escuela", "Seguimiento de la adaptación en el aula.",
                hoy.plusDays(9), hora(13, 0), hora(14, 0), false, false, null,
                List.of(maria.getId(), laura.getId(), pablo.getId()));
    }

    // El primer día de la semana pedido, hace unas ocho semanas
    private LocalDate desde(DayOfWeek dia) {
        return hoy.minusWeeks(8).with(TemporalAdjusters.nextOrSame(dia));
    }

    private static LocalTime hora(int horas, int minutos) {
        return LocalTime.of(horas, minutos);
    }
}
