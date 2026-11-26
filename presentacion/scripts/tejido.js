/*
 * Tejido de hilos en SVG: una grilla de hilos verticales y horizontales donde, en cruces
 * alternados, el vertical pasa por encima del horizontal (como una trama de tela).
 *
 * Cada hilo es un Trama.crearHilo recto, así se dibuja solo igual que los de la apertura.
 * Los cruces "por encima" son trocitos del hilo vertical que se dibujan arriba al final.
 * El CSS de la escena decide los colores, cuándo se dibuja cada hilo (variable --retraso
 * en el trazo de la máscara) y cuándo aparecen los cruces.
 */
window.Trama = window.Trama || {};

(function () {
  const SVG = "http://www.w3.org/2000/svg";
  const MEDIO_CRUCE = 24; // mitad del largo del trocito que pasa por encima
  const PATRON_HEBRA = 26; // largo de un ciclo de la hebra (trazo + hueco), igual que en el CSS

  function trazo(clase, d, estilo) {
    const elemento = document.createElementNS(SVG, "path");
    elemento.setAttribute("d", d);
    elemento.setAttribute("class", clase);
    elemento.setAttribute("fill", "none");
    if (estilo) elemento.setAttribute("style", estilo);
    return elemento;
  }

  /**
   * opciones: { prefijo, columnas: [x…], filas: [y…], arriba, abajo, izquierda, derecha,
   *             retrasoColumna(j), retrasoFila(i) } (retrasos en ms)
   */
  Trama.crearTejido = function (svg, opciones) {
    const { prefijo, columnas, filas, arriba, abajo, izquierda, derecha } = opciones;

    // Primero los verticales (quedan abajo) y después los horizontales.
    columnas.forEach((x, j) => {
      const id = prefijo + "-v" + j;
      Trama.crearHilo(svg, { id, desde: [x, arriba], hasta: [x, abajo], comba: 0, clase: "tj-v" });
      svg.querySelector('[data-trazo="' + id + '"]').style.setProperty("--retraso", opciones.retrasoColumna(j) + "ms");
    });
    filas.forEach((y, i) => {
      const id = prefijo + "-h" + i;
      Trama.crearHilo(svg, { id, desde: [izquierda, y], hasta: [derecha, y], comba: 0, clase: "tj-h" });
      svg.querySelector('[data-trazo="' + id + '"]').style.setProperty("--retraso", opciones.retrasoFila(i) + "ms");
    });

    // Cruces alternados: el vertical vuelve a pasar por encima. La hebra arranca en la misma
    // fase que la del hilo vertical, así el trocito no se nota pegado.
    const cruces = document.createElementNS(SVG, "g");
    cruces.setAttribute("class", "tj-cruces");
    filas.forEach((y, i) => {
      columnas.forEach((x, j) => {
        if ((i + j) % 2) return;
        const desde = y - MEDIO_CRUCE;
        const d = "M" + x + " " + desde + " L" + x + " " + (y + MEDIO_CRUCE);
        const fase = "stroke-dashoffset:" + -((desde - arriba) % PATRON_HEBRA);
        cruces.appendChild(trazo("hilo-base", d));
        cruces.appendChild(trazo("hilo-hebra", d, fase));
      });
    });
    svg.appendChild(cruces);
  };
})();
