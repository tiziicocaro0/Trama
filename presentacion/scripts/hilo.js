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

  /**
   * Agrega un hilo al SVG.
   * opciones: { id, desde: [x, y], hasta: [x, y], comba = 40, clase = "" }
   */
  Trama.crearHilo = function (svg, { id, desde, hasta, comba = 40, clase = "" }) {
    const d = curva(desde, hasta, comba);
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
