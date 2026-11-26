/*
 * Guion de la presentación: una escena por pantalla y un paso por clic.
 * Por ahora cada paso muestra un texto que describe lo que va a ir ahí.
 * Cuando una escena tenga animación propia, se agrega en scripts/escenas/ y se registra con
 * Trama.registrarEscena(id, { entrar, salir }) sin tocar el motor.
 */
window.Trama = window.Trama || {};

Trama.escenas = [
  {
    id: "comercial",
    titulo: "Comercial",
    orador: "Video · 40 s (fuera de los 8 minutos)",
    pasos: [
      "Cartel de espera con el ovillo: «En un momento comenzamos»",
      "El video comercial a pantalla completa",
    ],
  },
  {
    id: "apertura",
    titulo: "Apertura",
    orador: "Santiago · 50 s",
    pasos: [
      "Aparece María",
      "Aparece Valentina: un hilo las une",
      "Aparece la psicóloga, unida a Valentina",
      "Aparece la mamá, unida a Valentina",
      "Los hilos de María con la psicóloga y con la mamá quedan punteados y se cortan",
      "El 68 %: la información dispersa como nodos 3D unidos en una esfera",
      "Zoom out: la esfera se vuelve ovillo, rueda y revela el logo de TRAMA con brillo",
    ],
  },
  {
    id: "producto",
    titulo: "Producto y propuesta de valor",
    orador: "Maxi · 55 s",
    pasos: [
      "El logo de TRAMA",
      "La red: familia, escuela y profesionales unidos por el hilo",
      "La balanza: las familias nunca pagan",
    ],
  },
  {
    id: "celular",
    titulo: "Experiencia en el celular",
    orador: "Zoe · 80 s",
    pasos: ["Video real del celular a pantalla completa"],
  },
  {
    id: "demo",
    titulo: "Demo del MVP",
    orador: "Sofi · 100 s",
    pasos: ["Video real de la demo en la computadora a pantalla completa"],
  },
  {
    id: "arquitectura",
    titulo: "Cómo está construida",
    orador: "Ana · 50 s",
    pasos: [
      "Tres cajas: lo que ve María, la lógica y los datos",
      "Los íconos del stack entran animados y el hilo los teje",
      "El candado se cierra: datos cifrados y permisos en el servidor",
    ],
  },
  {
    id: "ia",
    titulo: "IA en el desarrollo",
    orador: "Tizi · 45 s",
    pasos: [
      "El recorrido IA → tests → CI → código",
      "El test de ediciones simultáneas pasa de rojo a verde",
    ],
  },
  {
    id: "cierre",
    titulo: "Validación y cierre",
    orador: "Lucas · 60 s",
    pasos: [
      "79 incrementos",
      "+1.000 pruebas automáticas",
      "1 red por chico",
      "Cierre en inglés: el hilo vuelve al ovillo junto al logo",
    ],
  },
];
