package com.trama.datosprueba;

import static com.trama.datosprueba.ArchivosDePrueba.AGUA;
import static com.trama.datosprueba.ArchivosDePrueba.MIEL;
import static com.trama.datosprueba.ArchivosDePrueba.OLIVA;
import static com.trama.datosprueba.ArchivosDePrueba.TERRACOTA;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.trama.tpo.demo.aporte.TipoAporte;
import com.trama.tpo.demo.aporte.Visibilidad;
import com.trama.tpo.demo.entity.usuario.Usuario;

// Lo que carga cada persona de la red de Valen: todos aportan en las secciones que les corresponden,
// con lugares, visibilidades, adjuntos, recursos y "Yo también lo observé" variados.
final class AportesDeValen {

    private final CargadorDatosDePrueba c;
    private final UUID id;
    private final Usuario laura, pablo, elena, maria, diego, sofia;

    AportesDeValen(CargadorDatosDePrueba cargador, UUID proyectoId, Usuario laura, Usuario pablo,
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
        List<UUID> fortalezas = fortalezas();
        intereses();
        List<UUID> comunicacion = comunicacion();
        List<UUID> sensorial = sensorial();
        List<UUID> estrategias = estrategias();
        rutinas();
        desregulacion();
        notas();
        recursos();

        // La red confirma lo que también ve en otros contextos
        c.confirmar(maria, fortalezas.get(0));
        c.confirmar(elena, fortalezas.get(0));
        c.confirmar(laura, fortalezas.get(1));
        c.confirmar(sofia, fortalezas.get(2));
        c.confirmar(pablo, fortalezas.get(3));
        c.confirmar(laura, comunicacion.get(0));
        c.confirmar(sofia, comunicacion.get(0));
        c.confirmar(sofia, sensorial.get(0));
        c.confirmar(laura, estrategias.get(0));
        c.confirmar(maria, estrategias.get(0));
    }

    private List<UUID> fortalezas() {
        List<UUID> ids = new ArrayList<>();
        ids.add(c.aporte(laura, id, 3, TipoAporte.FORTALEZA, "Arma rompecabezas de 100 piezas",
                "Se concentra un buen rato y no se frustra si una pieza no entra.",
                c.datos("contexto", "CASA", "ejemplo", "El domingo terminó uno de animales de la selva sin ayuda."),
                Visibilidad.TODOS));
        ids.add(c.aporte(maria, id, 6, TipoAporte.FORTALEZA, "Recuerda el orden de la semana",
                "Sabe qué materia toca cada día y se lo recuerda a sus compañeros.",
                c.datos("contexto", "ESCUELA", "ejemplo", "Avisó que el jueves había música antes de que llegara la profe."),
                Visibilidad.TODOS));
        ids.add(c.aporte(pablo, id, 11, TipoAporte.FORTALEZA, "Muy constante en natación",
                "No falta nunca y respeta los turnos para tirarse al agua.",
                c.datos("contexto", "OTRO", "contextoOtro", "Club de natación"), Visibilidad.TODOS));
        ids.add(c.aporte(sofia, id, 14, TipoAporte.FORTALEZA, "Sigue consignas con apoyo visual",
                "Con una secuencia de tres pasos completa la actividad de principio a fin.",
                c.datos("contexto", "CONSULTORIO"), Visibilidad.TODOS));
        ids.add(c.aporte(elena, id, 19, TipoAporte.FORTALEZA, "Cuida mucho a su perro",
                "Le pone agua todas las mañanas sin que nadie se lo pida.",
                c.datos("contexto", "CASA", "ejemplo", "Cuando se quedó a dormir en casa, se acordó de llevar la correa."),
                Visibilidad.TODOS));
        ids.add(c.aporte(diego, id, 25, TipoAporte.FORTALEZA, "Pone en palabras lo que siente",
                "Con la ruleta de emociones puede decir si está enojada o cansada.",
                c.datos("contexto", "CONSULTORIO"), Visibilidad.PROFESIONALES));
        return ids;
    }

    private void intereses() {
        c.aporte(laura, id, 2, TipoAporte.INTERES, "Los dinosaurios",
                "Sabe el nombre de más de 30 y los ordena por tamaño.",
                c.datos("categoria", "TEMA", "intensidad", "ALTA"), Visibilidad.TODOS);
        c.aporte(pablo, id, 9, TipoAporte.INTERES, "Bluey",
                "Mira un capítulo antes de cenar y repite las frases de los personajes.",
                c.datos("categoria", "PERSONAJE", "intensidad", "ALTA"), Visibilidad.TODOS);
        c.aporte(elena, id, 16, TipoAporte.INTERES, "Cocinar galletitas",
                "Le encanta medir los ingredientes y amasar.",
                c.datos("categoria", "ACTIVIDAD", "intensidad", "MEDIA"), Visibilidad.TODOS);
        c.aporte(maria, id, 22, TipoAporte.INTERES, "Los mapas",
                "En la biblioteca siempre elige el atlas y busca países con forma rara.",
                c.datos("categoria", "OTRO", "intensidad", "MEDIA", "categoriaOtra", "Mapas y banderas"), Visibilidad.TODOS);
        c.aporte(sofia, id, 30, TipoAporte.INTERES, "Masa para modelar",
                "La usa para calmarse y para armar los personajes del cuento.",
                c.datos("categoria", "OBJETO", "intensidad", "BAJA"), Visibilidad.TODOS);
    }

    private List<UUID> comunicacion() {
        UUID tarjeta = c.imagen(diego, id, "tarjeta-de-ayuda.png", "Tarjeta de ayuda",
                new String[] {"Necesito", "ayuda"}, AGUA, null);
        List<UUID> ids = new ArrayList<>();
        ids.add(c.aporte(diego, id, 4, TipoAporte.COMUNICACION, "Pide ayuda con una tarjeta",
                "Cuando se traba con una tarea, muestra la tarjeta en vez de llorar.",
                c.datos("categoria", "EXPRESION", "formasComunicacion", List.of("VERBAL", "PICTOGRAMAS"),
                        "comoHablarle", "Frases cortas y de a una consigna.",
                        "queEvitar", "Preguntas encadenadas o muy abiertas."),
                Visibilidad.TODOS, tarjeta));
        ids.add(c.aporte(maria, id, 10, TipoAporte.COMUNICACION, "Necesita tiempo para responder",
                "Contesta si se la espera unos segundos sin repetir la pregunta.",
                c.datos("categoria", "TIEMPO_ESPERA", "formasComunicacion", List.of("VERBAL"),
                        "comoHablarle", "Hacer la pregunta una vez y esperar.",
                        "queEvitar", "Apurarla o completar sus frases."),
                Visibilidad.TODOS));
        ids.add(c.aporte(laura, id, 17, TipoAporte.COMUNICACION, "Señala cuando está cansada",
                "A la tarde habla menos y señala lo que quiere.",
                c.datos("categoria", "NO_VERBAL", "formasComunicacion", List.of("GESTOS"),
                        "comoHablarle", "Nombrar lo que señala y ofrecer dos opciones.",
                        "queEvitar", "Pedirle que lo diga con palabras."),
                Visibilidad.SOLO_TUTORES));
        ids.add(c.aporte(sofia, id, 27, TipoAporte.COMUNICACION, "Le cuesta entender los chistes",
                "Toma las frases al pie de la letra; si se le explica, se ríe.",
                c.datos("categoria", "COMPRENSION", "formasComunicacion", List.of("VERBAL", "OTRA"),
                        "otraForma", "Dibujos rápidos en una libreta",
                        "comoHablarle", "Decir lo que se quiere decir, sin ironías.",
                        "queEvitar", "Dobles sentidos cuando está nerviosa."),
                Visibilidad.TODOS));
        return ids;
    }

    private List<UUID> sensorial() {
        List<UUID> ids = new ArrayList<>();
        ids.add(c.aporte(maria, id, 5, TipoAporte.SENSORIAL, "Le molesta el timbre del recreo",
                "Se tapa los oídos y se queda quieta hasta que termina.",
                c.datos("lista", "CUESTA", "categoria", "AUDICION", "contexto", "ESCUELA"), Visibilidad.TODOS));
        ids.add(c.aporte(laura, id, 8, TipoAporte.SENSORIAL, "La calma la manta pesada",
                "Antes de dormir la pide ella y se duerme más rápido.",
                c.datos("lista", "AYUDA", "categoria", "TACTO", "contexto", "CASA"), Visibilidad.TODOS));
        ids.add(c.aporte(sofia, id, 13, TipoAporte.SENSORIAL, "Hamacarse la regula",
                "Cinco minutos de hamaca antes de la sesión y trabaja mucho más tranquila.",
                c.datos("lista", "AYUDA", "categoria", "MOVIMIENTO_EQUILIBRIO", "contexto", "CONSULTORIO"),
                Visibilidad.TODOS));
        ids.add(c.aporte(elena, id, 20, TipoAporte.SENSORIAL, "No le gustan las etiquetas de la ropa",
                "Se rasca y se enoja hasta que se las cortamos.",
                c.datos("lista", "CUESTA", "categoria", "TACTO", "contexto", "CASA"), Visibilidad.TODOS));
        ids.add(c.aporte(pablo, id, 28, TipoAporte.SENSORIAL, "Las luces del súper la abruman",
                "Con la gorra puesta aguanta mejor las compras.",
                c.datos("lista", "CUESTA", "categoria", "VISION", "contexto", "OTRO", "contextoOtro", "Supermercado"),
                Visibilidad.TODOS));
        return ids;
    }

    private List<UUID> estrategias() {
        UUID agenda = c.imagen(sofia, id, "agenda-de-la-tarde.png", "Agenda de la tarde",
                new String[] {"Merienda", "Tarea", "Plaza", "Baño"}, MIEL, null);
        List<UUID> ids = new ArrayList<>();
        ids.add(c.aporte(sofia, id, 7, TipoAporte.ESTRATEGIA, "Anticipar con agenda visual",
                "Al llegar repasamos juntas la agenda y tacha cada actividad al terminarla.",
                c.datos("categoria", "ANTICIPACION_SECUENCIACION", "situacion", "Cambios de actividad",
                        "resultado", "FUNCIONO", "contextos", List.of("CASA", "ESCUELA", "CONSULTORIO")),
                Visibilidad.TODOS, agenda));
        ids.add(c.aporte(maria, id, 12, TipoAporte.ESTRATEGIA, "Rincón de pausa en el aula",
                "Puede ir al rincón con almohadones cuando lo necesita, con un reloj de arena.",
                c.datos("categoria", "REGULACION_PAUSAS", "situacion", "Mucho ruido en clase",
                        "resultado", "FUNCIONO_EN_PARTE", "contextos", List.of("ESCUELA")),
                Visibilidad.TODOS));
        ids.add(c.aporte(pablo, id, 18, TipoAporte.ESTRATEGIA, "Temporizador para dejar la tablet",
                "Avisar con cinco minutos de anticipación y poner un temporizador.",
                c.datos("categoria", "ANTICIPACION_SECUENCIACION", "situacion", "Terminar de jugar con la tablet",
                        "resultado", "NO_FUNCIONO", "contextos", List.of("CASA")),
                Visibilidad.TODOS));
        ids.add(c.aporte(diego, id, 24, TipoAporte.ESTRATEGIA, "Usar sus intereses para arrancar",
                "Empezar la actividad con un dinosaurio hace que se enganche enseguida.",
                c.datos("categoria", "MOTIVACION_INTERESES", "situacion", "Actividades nuevas",
                        "resultado", "FUNCIONO", "contextos", List.of("DISTINTOS_CONTEXTOS")),
                Visibilidad.PROFESIONALES));
        return ids;
    }

    private void rutinas() {
        UUID manos = c.imagen(laura, id, "lavarse-las-manos.png", "Lavarse las manos",
                new String[] {"Abrir", "Jabón", "Frotar", "Secar"}, AGUA, null);
        c.aporte(laura, id, 1, TipoAporte.RUTINA, "Se lava las manos sola",
                "Con el pictograma pegado en el espejo sigue los pasos sin ayuda.",
                c.datos("categoria", "HIGIENE_CUIDADO_PERSONAL", "contextos", List.of("CASA")), Visibilidad.TODOS, manos);
        c.aporte(elena, id, 15, TipoAporte.RUTINA, "Desayuno siempre en el mismo orden",
                "Leche, tostada y después la fruta. Si se cambia el orden, se angustia.",
                c.datos("categoria", "ALIMENTACION", "contextos", List.of("CASA")), Visibilidad.TODOS);
        c.aporte(pablo, id, 21, TipoAporte.RUTINA, "Se viste con la ropa preparada",
                "Dejarla la noche anterior en la silla, en el orden en que se la pone.",
                c.datos("categoria", "VESTIDO", "contextos", List.of("CASA")), Visibilidad.TODOS);
        c.aporte(maria, id, 26, TipoAporte.RUTINA, "Ordena su mochila al final del día",
                "Con la lista en la tapa del cuaderno guarda todo sin olvidarse nada.",
                c.datos("categoria", "PERSONALIZADA", "categoriaNombre", "Organización escolar",
                        "contextos", List.of("ESCUELA")), Visibilidad.TODOS);
    }

    private void desregulacion() {
        c.aporte(maria, id, 4, TipoAporte.DESREGULACION, "Se balancea y habla más fuerte",
                "Suele pasar antes del recreo largo o cuando hay acto.",
                c.datos("lista", "SENALES"), Visibilidad.TODOS);
        c.aporte(laura, id, 9, TipoAporte.DESREGULACION, "Salir a un lugar tranquilo",
                "Acompañarla sin hablar mucho y ofrecerle agua.",
                c.datos("lista", "AYUDA"), Visibilidad.TODOS);
        c.aporte(diego, id, 23, TipoAporte.DESREGULACION, "No tocarla sin avisar",
                "Empeora si la agarran del brazo; mejor ponerse a su altura y nombrarla.",
                c.datos("lista", "EVITAR"), Visibilidad.TODOS);
        c.aporte(elena, id, 29, TipoAporte.DESREGULACION, "Se tapa la cara con las manos",
                "Es la primera señal de que algo la está desbordando.",
                c.datos("lista", "SENALES"), Visibilidad.TODOS);
    }

    private void notas() {
        UUID informe = c.pdf(diego, id, "informe-trimestral.pdf", "Informe trimestral - Valentina Ruiz",
                "Avances en tolerancia a la espera y en el uso de la tarjeta de ayuda.", null);
        c.aporte(diego, id, 3, TipoAporte.NOTA_PROFESIONAL, "Avances en tolerancia a la espera",
                "En las últimas sesiones espera su turno con apoyo del temporizador.",
                c.datos("tipoNota", "INFORME_BREVE", "fecha", LocalDate.now().minusDays(3).toString()),
                Visibilidad.PROFESIONALES, informe);
        c.aporte(maria, id, 11, TipoAporte.NOTA_PROFESIONAL, "Sugerencias para el acto escolar",
                "Ensayar con anticipación y ubicarla cerca de la salida, con auriculares.",
                c.datos("tipoNota", "ORIENTACION", "fecha", LocalDate.now().minusDays(11).toString()),
                Visibilidad.TODOS);
        c.aporte(sofia, id, 17, TipoAporte.NOTA_PROFESIONAL, "Motricidad fina en progreso",
                "Mejoró el agarre del lápiz con el engrosador; seguir con masa y pinzas.",
                c.datos("tipoNota", "OBSERVACION", "fecha", LocalDate.now().minusDays(17).toString()),
                Visibilidad.PROFESIONALES);
        c.aporte(diego, id, 31, TipoAporte.NOTA_PROFESIONAL, "Pautas para las vacaciones",
                "Mantener horarios de sueño y anticipar los viajes con fotos del lugar.",
                c.datos("tipoNota", "ORIENTACION", "fecha", LocalDate.now().minusDays(31).toString()),
                Visibilidad.TODOS);
    }

    // Pestaña Recursos: archivos sueltos, además de los adjuntos de los aportes
    private void recursos() {
        c.imagen(laura, id, "tablero-de-emociones.png", "¿Cómo me siento?",
                new String[] {"Contenta", "Enojada", "Cansada", "Asustada"}, TERRACOTA, Visibilidad.TODOS);
        c.imagen(maria, id, "rutina-del-aula.png", "Rutina del aula",
                new String[] {"Saludo", "Lengua", "Recreo", "Matemática"}, OLIVA, Visibilidad.TODOS);
        c.imagen(sofia, id, "pasos-para-vestirse.png", "Pasos para vestirse",
                new String[] {"Remera", "Pantalón", "Medias", "Zapatillas"}, MIEL, Visibilidad.TODOS);
        c.pdf(diego, id, "pautas-para-la-familia.pdf", "Pautas para acompañar en casa",
                "Anticipar los cambios, ofrecer opciones y validar lo que siente.", Visibilidad.SOLO_SALUD);
    }
}
