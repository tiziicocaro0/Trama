/*
 * Hilos de lana en SVG que se dibujan solos.
 *
 * Cada hilo es una curva entre dos puntos con una "comba" (cuánto se arquea). Se dibuja con una
 * máscara: la máscara avanza a lo largo de la curva y va descubriendo el hilo, así el trazo
 * puede tener textura (las hebras claras) sin que se rompa el efecto de dibujo.
 *
 * El estado lo maneja CSS: el trazo de la máscara lleva data-trazo="<id>" y la escena decide
 * con clases cuándo se dibuja (stroke-dashoffset de 1 a 0).
 */
window.Trama = window.Trama || {};

(function () {
  const SVG = "http://www.w3.org/2000/svg";

  function nodo(tipo, atributos) {
    const elemento = document.createElementNS(SVG, tipo);
    Object.entries(atributos).forEach(([clave, valor]) => elemento.setAttribute(clave, valor));
    return elemento;
  }

  // Curva cúbica con los puntos de control corridos en perpendicular: el hilo cuelga o se arquea.
  function curva(desde, hasta, comba) {
    const [x1, y1] = desde;
    const [x2, y2] = hasta;
    const largo = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = -(y2 - y1) / largo;
    const ny = (x2 - x1) / largo;
    const c1 = [x1 + (x2 - x1) * 0.3 + nx * comba, y1 + (y2 - y1) * 0.3 + ny * comba];
    const c2 = [x1 + (x2 - x1) * 0.7 + nx * comba * 0.8, y1 + (y2 - y1) * 0.7 + ny * comba * 0.8];
    return "M" + x1 + " " + y1 + " C" + c1.join(" ") + " " + c2.join(" ") + " " + x2 + " " + y2;
  }

  /*
   * Hilo enrulado que sale hacia un destino pero se pierde: avanza haciendo rulos (una cicloide
   * estirada), se desvía de a poco y termina en el aire, sin llegar.
   * rulos: { vueltas, radio, alcance (0-1 del camino), lado (1 o -1), deriva (desvío en px) }
   */
  function enrulado(desde, hasta, { vueltas = 4, radio = 40, alcance = 0.6, lado = 1, deriva = 80 }) {
    const [x1, y1] = desde;
    const largo = Math.hypot(hasta[0] - x1, hasta[1] - y1) || 1;
    const ux = (hasta[0] - x1) / largo;
    const uy = (hasta[1] - y1) / largo;
    const nx = -uy * lado;
    const ny = ux * lado;
    const puntos = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const avance = largo * alcance * t;
      const angulo = t * vueltas * Math.PI * 2;
      // Los rulos crecen al salir y se achican al final, como si el hilo se quedara sin fuerza.
      const r = radio * Math.min(t / 0.15, 1) * (0.75 + 0.35 * Math.sin(t * 7)) * (1 - 0.4 * t);
      // El desvío ondula: el hilo duda, cambia de rumbo y termina lejos de donde iba.
      const desvio = deriva * Math.sin(t * Math.PI * 0.9) + deriva * 0.6 * t * t + deriva * 0.45 * Math.sin(t * Math.PI * 3.2);
      const adelante = avance - r * Math.sin(angulo);
      const costado = r * (1 - Math.cos(angulo)) + desvio;
      puntos.push([x1 + ux * adelante + nx * costado, y1 + uy * adelante + ny * costado]);
    }
    // Catmull-Rom a curvas cúbicas, para que el trazo quede suave.
    let d = "M" + puntos[0].map(Math.round).join(" ");
    for (let i = 0; i < puntos.length - 1; i++) {
      const [p0, p1, p2, p3] = [puntos[i - 1] || puntos[i], puntos[i], puntos[i + 1], puntos[i + 2] || puntos[i + 1]];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += " C" + [c1, c2, p2].map((q) => q.map((v) => v.toFixed(1)).join(" ")).join(" ");
    }
    return d;
  }

  /**
   * Agrega un hilo al SVG.
   * opciones: { id, desde: [x, y], hasta: [x, y], comba = 40, clase = "", rulos }
   * Con rulos el hilo no llega a destino: se enrula y se pierde (ver enrulado).
   */
  Trama.crearHilo = function (svg, { id, desde, hasta, comba = 40, clase = "", rulos = null }) {
    const d = rulos ? enrulado(desde, hasta, rulos) : curva(desde, hasta, comba);
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = nodo("defs", {});
      svg.prepend(defs);
    }

    const mascara = nodo("mask", {
      id: "mascara-" + id,
      maskUnits: "userSpaceOnUse",
      x: 0, y: 0, width: 1920, height: 1080,
    });
    mascara.appendChild(nodo("path", {
      d, pathLength: 1, class: "hilo-trazo", "data-trazo": id,
      fill: "none", stroke: "#fff", "stroke-width": 36, "stroke-linecap": "round",
    }));
    defs.appendChild(mascara);

    const grupo = nodo("g", { class: ("hilo " + clase).trim(), "data-hilo": id, mask: "url(#mascara-" + id + ")" });
    grupo.appendChild(nodo("path", { d, class: "hilo-base", fill: "none" }));
    grupo.appendChild(nodo("path", { d, class: "hilo-hebra", fill: "none" }));
    svg.appendChild(grupo);
    return grupo;
  };
})();
