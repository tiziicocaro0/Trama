/*
 * Guion de la presentación: una escena por pantalla y un paso por momento del guion.
 * Cada paso avanza solo cuando se cumple su "duracion" (en segundos). Las duraciones están
 * estimadas a partir del guion a unas 2,5 palabras por segundo, con una pausa breve: ajústenlas
 * acá después de ensayar con la barra de práctica (tecla P).
 * duracion null = el paso espera un clic.
 * fueraDelPitch = la escena no cuenta en los 8 minutos (el comercial).
 */
window.Trama = window.Trama || {};

Trama.escenas = [
  {
    id: "comercial",
    titulo: "Comercial",
    orador: "Video · 40 s (fuera de los 8 minutos)",
    fueraDelPitch: true,
    pasos: [
      { texto: "Cartel de espera con el ovillo: «En un momento comenzamos»", duracion: null },
      { texto: "El video comercial a pantalla completa", duracion: 40 },
    ],
  },
  {
    id: "apertura",
    titulo: "Apertura",
    orador: "Santiago · 50 s",
    pasos: [
      { texto: "Esta es María. Es maestra de primaria…", duracion: 5 },
      { texto: "…y este año tiene en su aula a Valentina, una alumna autista.", duracion: 6 },
      { texto: "La psicóloga de Valentina sabe qué la calma.", duracion: 4 },
      { texto: "Su mamá sabe qué la desregula.", duracion: 4 },
      { texto: "María no sabe ninguna de las dos cosas.", duracion: 5 },
      { texto: "Y no es un caso aislado: el 68 %… la que termina haciendo de mensajera es la familia.", duracion: 18 },
      { texto: "Nosotros venimos a cambiar eso.", duracion: 8 },
    ],
  },
  {
    id: "producto",
    titulo: "Producto y propuesta de valor",
    orador: "Maxi · 55 s",
    pasos: [
      { texto: "Por eso creamos TRAMA: un solo lugar… lo que saben de un chico.", duracion: 8 },
      { texto: "Qué le interesa, cómo comunicarse con él, qué lo calma, qué estrategias funcionan.", duracion: 8 },
      { texto: "Cada persona aporta desde su lugar, y cada una ve solo lo que le corresponde ver.", duracion: 13 },
      { texto: "¿Y por qué nos elegirían?", duracion: 4 },
      { texto: "Porque no es otro chat ni otra planilla: está pensado para esta red en particular.", duracion: 8 },
      { texto: "Y porque las familias nunca pagan… sin publicidad y sin vender datos.", duracion: 14 },
    ],
  },
  {
    id: "celular",
    titulo: "Experiencia en el celular",
    orador: "Zoe · 80 s",
    pasos: [{ texto: "Video real del celular a pantalla completa", duracion: 80 }],
  },
  {
    id: "demo",
    titulo: "Demo del MVP",
    orador: "Sofi · 100 s",
    pasos: [{ texto: "Video real de la demo en la computadora a pantalla completa", duracion: 100 }],
  },
  {
    id: "arquitectura",
    titulo: "Cómo está construida",
    orador: "Ana · 50 s",
    pasos: [
      { texto: "Tres cajas: lo que ve María, la lógica y los datos", duracion: 14 },
      { texto: "Los íconos del stack entran animados y el hilo los teje", duracion: 20 },
      { texto: "El candado se cierra: datos cifrados y permisos en el servidor", duracion: 16 },
    ],
  },
  {
    id: "ia",
    titulo: "IA en el desarrollo",
    orador: "Tizi · 45 s",
    pasos: [
      { texto: "El recorrido IA → tests → CI → código", duracion: 24 },
      { texto: "El test de ediciones simultáneas pasa de rojo a verde", duracion: 21 },
    ],
  },
  {
    id: "cierre",
    titulo: "Validación y cierre",
    orador: "Lucas · 60 s",
    pasos: [
      { texto: "79 incrementos", duracion: 8 },
      { texto: "+1.000 pruebas automáticas", duracion: 8 },
      { texto: "1 red por chico", duracion: 14 },
      { texto: "Cierre en inglés: el hilo vuelve al ovillo junto al logo", duracion: 30 },
    ],
  },
];
