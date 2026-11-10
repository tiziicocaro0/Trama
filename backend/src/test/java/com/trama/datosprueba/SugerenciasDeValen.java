package com.trama.datosprueba;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.usuario.Usuario;

import java.util.List;
import java.util.UUID;

// 7.2: actividades para casa que sugieren los profesionales, cada una vinculada a un
// interés de Valen (en el orden en que los carga AportesDeValen: dinosaurios, Bluey,
// galletitas, mapas y masa para modelar).
class SugerenciasDeValen {

    private final CargadorDatosDePrueba c;
    private final UUID id;
    private final Usuario maria;
    private final Usuario sofia;
    private final Usuario diego;

    SugerenciasDeValen(CargadorDatosDePrueba cargador, UUID proyectoId, Usuario maria, Usuario sofia, Usuario diego) {
        this.c = cargador;
        this.id = proyectoId;
        this.maria = maria;
        this.sofia = sofia;
        this.diego = diego;
    }

    void cargar(List<UUID> intereses) {
        UUID dinosaurios = intereses.get(0);
        UUID bluey = intereses.get(1);
        UUID galletitas = intereses.get(2);
        UUID mapas = intereses.get(3);
        UUID masa = intereses.get(4);

        sugerir(maria, 3, "Ordenar los dinosaurios del más chico al más grande",
                "En la merienda, pedirle que los ponga en fila y los cuente en voz alta. Después, que diga cuál está en el medio.",
                dinosaurios, "Los muñecos de dinosaurios que ya tiene");
        sugerir(maria, 8, "Buscar en el mapa a dónde vamos el fin de semana",
                "Antes de salir, marcar juntos en el mapa el punto de partida y el de llegada. Le da previsibilidad y le encanta.",
                mapas, "Un mapa impreso o el del celular");
        sugerir(sofia, 5, "Amasar galletitas siguiendo la receta en imágenes",
                "Que mida cada ingrediente mirando la receta con pictogramas. Trabaja la secuencia y la motricidad fina.",
                galletitas, "Receta con pictogramas, tazas medidoras");
        sugerir(sofia, 12, "Armar con masa los personajes del cuento",
                "Después de leer, que modele un personaje y cuente qué hizo. Si está nerviosa, la masa la ayuda a bajar.",
                masa, null);
        sugerir(diego, 6, "Jugar a Bluey: ¿qué pasa después?",
                "Pausar el capítulo y preguntarle qué cree que va a pasar. Ayuda a anticipar y a poner en palabras.",
                bluey, null);
    }

    private void sugerir(Usuario autor, int haceDias, String actividad, String comoHacerla, UUID interes, String materiales) {
        String datos = materiales == null
                ? c.datos("interesId", interes.toString())
                : c.datos("interesId", interes.toString(), "materiales", materiales);
        c.aporte(autor, id, haceDias, TipoAporte.SUGERENCIA, actividad, comoHacerla, datos, Visibilidad.TODOS);
    }
}
