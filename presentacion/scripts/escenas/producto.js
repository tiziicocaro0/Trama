/*
 * Pantalla 3 · Producto y propuesta de valor (Maxi).
 *
 * Pasos:
 * 1. El logo, que quedó de la apertura, sube y hace lugar: aparece Valentina.
 * 2. Lo que se sabe de ella (intereses, comunicación, calma, estrategias), unido con hilos.
 * 3. Cada persona aporta desde su lugar: entran familia, escuela y profesionales, y sus hilos
 *    se entrelazan entre ellas y con los temas.
 * 4. Fundido a rojo con «¿Y por qué nos elegirían?».
 * 5. No es otro chat ni otra planilla: los dos se tachan con un hilo.
 * 6. La balanza: las familias no pagan; la sostienen profesionales e instituciones.
 *
 * Todo son clases CSS acumulativas (p1…p6), así retroceder deshace cada paso. Al retroceder se
 * agrega "volviendo", que saca los retrasos para que el cambio sea inmediato.
 */
(function () {
  const VALENTINA = { x: 960, y: 650, tam: 260 };

  // Temas alrededor de Valentina.
  const TEMAS = [
    { id: "intereses", nombre: "Intereses", icono: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z", paso2: [520, 500] },
    { id: "comunicacion", nombre: "Comunicación", icono: "M4 5h16v11H10l-6 4z", paso2: [1400, 500] },
    { id: "calma", nombre: "Calma", icono: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z", paso2: [520, 810] },
    { id: "estrategias", nombre: "Estrategias", icono: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z", paso2: [1400, 810] },
  ];

  const PERSONAS = [
    { id: "familia", imagen: "mama", nombre: "Familia", x: 960, y: 290 },
    { id: "escuela", imagen: "maria", nombre: "Escuela", x: 190, y: 655 },
    { id: "profesionales", imagen: "psicologa", nombre: "Profesionales", x: 1730, y: 655 },
  ];

  // La red del paso 3: [desde, hasta, comba]. Las personas se unen entre ellas y con los temas;
  // las curvas se cruzan a propósito para que se vea entrelazado.
  const RED = [
    ["familia", "escuela", 90], ["familia", "profesionales", -90], ["escuela", "profesionales", 330],
    ["familia", "intereses", 50], ["familia", "comunicacion", -50], ["familia", "calma", -60], ["familia", "estrategias", 60],
    ["escuela", "intereses", 50], ["escuela", "calma", -60], ["escuela", "estrategias", 90],
    ["profesionales", "comunicacion", -50], ["profesionales", "estrategias", 60], ["profesionales", "calma", -90],
  ];

  const iconoSvg = (d, clase) =>
    '<svg class="' + clase + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';

  function montar(escena) {
    escena.classList.add("producto");
    escena.innerHTML =
      '<svg class="pr-hilos" viewBox="0 0 1920 1080" aria-hidden="true"></svg>' +
      '<svg class="pr-red" viewBox="0 0 1920 1080" aria-hidden="true"></svg>' +
      '<div class="pr-logo"><img src="assets/logo/trama.png" alt="TRAMA"></div>' +
      '<figure class="pr-valentina"><img src="assets/ilustraciones/valentina.webp" alt=""><figcaption>Valentina</figcaption></figure>' +
      TEMAS.map((tema, i) =>
        '<p class="pr-tema" style="--i:' + i + ";left:" + tema.paso2[0] + "px;top:" + tema.paso2[1] + 'px">' +
        iconoSvg(tema.icono, "pr-icono") + "<span>" + tema.nombre + "</span></p>"
      ).join("") +
      PERSONAS.map((persona, i) =>
        '<figure class="pr-persona" style="--i:' + i + ";left:" + (persona.x - 70) + "px;top:" + (persona.y - 70) + 'px">' +
        '<img src="assets/ilustraciones/' + persona.imagen + '.webp" alt=""><figcaption>' + persona.nombre + "</figcaption></figure>"
      ).join("") +
      '<h2 class="pr-pregunta">¿Y por qué nos elegirían?</h2>' +
      armarNoEs() + armarBalanza() +
      '<p class="pr-etiquetas"><span>Sin publicidad</span><span>Sin vender datos</span></p>';

    // Paso 2: hilos de Valentina a cada tema.
    const hilos = escena.querySelector(".pr-hilos");
    TEMAS.forEach((tema, i) => {
      const [x, y] = tema.paso2;
      const angulo = Math.atan2(y - VALENTINA.y, x - VALENTINA.x);
      const radio = VALENTINA.tam / 2 + 12;
      Trama.crearHilo(hilos, {
        id: "pr-" + tema.id,
        desde: [VALENTINA.x + Math.cos(angulo) * radio, VALENTINA.y + Math.sin(angulo) * radio],
        hasta: [x + (x < VALENTINA.x ? 150 : -150), y],
        comba: i % 2 ? 40 : -40,
      });
      hilos.querySelector('[data-trazo="pr-' + tema.id + '"]').style.setProperty("--retraso", 300 + i * 450 + "ms");
    });

    // Paso 3: la red. Los hilos van de centro a centro; las personas y los temas los tapan.
    const centros = {};
    PERSONAS.forEach((persona) => (centros[persona.id] = [persona.x, persona.y]));
    TEMAS.forEach((tema) => (centros[tema.id] = tema.paso2));
    const red = escena.querySelector(".pr-red");
    RED.forEach(([desde, hasta, comba], i) => {
      const id = "red-" + desde + "-" + hasta;
      const clase = PERSONAS.some((persona) => persona.id === hasta) ? "red-personas" : "red-temas";
      Trama.crearHilo(red, { id, desde: centros[desde], hasta: centros[hasta], comba, clase });
      red.querySelector('[data-trazo="' + id + '"]').style.setProperty("--retraso", 1300 + i * 220 + "ms");
    });
  }

  // Paso 5: un chat y una planilla, tachados con un hilo.
  function armarNoEs() {
    const chat = '<path d="M30 40h220v140H110l-60 50v-50H30z"/><path d="M75 90h130M75 130h90"/>';
    const planilla = '<rect x="30" y="35" width="220" height="180" rx="10"/><path d="M30 80h220M30 125h220M30 170h220M103 35v180M176 35v180"/>';
    const tarjeta = (dibujo, texto, i) =>
      '<figure class="pr-noes" style="--i:' + i + '"><svg viewBox="0 0 280 250" aria-hidden="true">' + dibujo +
      '<path class="pr-tachon" pathLength="1" d="M10 230 C90 150 170 120 270 20"/></svg><figcaption>' + texto + "</figcaption></figure>";
    return '<div class="pr-noes-fila">' + tarjeta(chat, "Otro chat", 0) + tarjeta(planilla, "Otra planilla", 1) + "</div>" +
      '<p class="pr-pensado">Pensado para esta red</p>';
  }

  // Paso 6: la balanza. Los platos cuelgan de la barra y giran al revés para quedar derechos.
  function armarBalanza() {
    const plato = (x, clase, contenido) =>
      '<g class="bz-plato ' + clase + '">' +
      '<path class="bz-cuerda" d="M' + x + " 330 L" + (x - 120) + " 560 M" + x + " 330 L" + (x + 120) + ' 560"/>' +
      '<path class="bz-fuente" d="M' + (x - 150) + " 560 Q" + x + " 650 " + (x + 150) + ' 560 Z"/>' + contenido + "</g>";
    const bloque = (y, texto, clase) =>
      '<g class="bz-bloque ' + clase + '"><rect x="1310" y="' + y + '" width="220" height="58" rx="12"/>' +
      '<text x="1420" y="' + (y + 39) + '">' + texto + "</text></g>";
    return '<svg class="pr-balanza" viewBox="0 0 1920 1080" aria-hidden="true">' +
      '<path class="bz-pie" d="M860 930 L1060 930 L1020 895 L900 895 Z"/>' +
      '<rect class="bz-poste" x="948" y="330" width="24" height="570" rx="12"/>' +
      '<g class="bz-brazo"><rect class="bz-barra" x="480" y="318" width="960" height="24" rx="12"/>' +
      plato(510, "bz-izquierdo",
        '<text class="bz-nombre" x="510" y="545">Familias</text><text class="bz-gratis" x="510" y="720">Gratis</text>') +
      plato(1420, "bz-derecho", bloque(494, "Profesionales", "bz-uno") + bloque(430, "Instituciones", "bz-dos")) +
      "</g>" +
      '<circle class="bz-eje" cx="960" cy="330" r="24"/></svg>';
  }

  function entrar(paso, direccion, escena) {
    void escena.offsetWidth; // recién montada: fija el estado inicial para que las clases animen
    escena.classList.toggle("volviendo", direccion < 0);
    for (let i = 1; i <= 6; i++) escena.classList.toggle("p" + i, i <= paso + 1);
    Trama.fondoOscuro(paso >= 3);
  }

  Trama.registrarEscena("producto", { montar, entrar, continua: true });
})();
