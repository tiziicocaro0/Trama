/*
 * Pantalla 2 · Apertura (Santiago).
 *
 * Pasos:
 * 1. María.  2. Valentina, unida a María.  3. La psicóloga, unida a Valentina.
 * 4. La mamá, unida a Valentina.  5. Los hilos de María hacia la psicóloga y la mamá no llegan y caen.
 * 6. La red se achica hasta ser un nodo más: aparece el 68 % y la esfera de información dispersa.
 * 7. Zoom out: la esfera se aplana, se vuelve ovillo, rueda y descubre el logo, que brilla.
 *
 * Los pasos 1 a 6 son clases CSS acumulativas (p1…p6) en la escena, así ir hacia atrás deshace
 * cada paso solo. El paso 7 es una línea de tiempo en JS porque mueve varias cosas sincronizadas.
 */
(function () {
  const PERSONAS = [
    { id: "maria", nombre: "María", rol: "Maestra", x: 420, y: 540, tam: 300 },
    { id: "valentina", nombre: "Valentina", rol: "", x: 980, y: 560, tam: 300 },
    { id: "psicologa", nombre: "Su psicóloga", rol: "", x: 1520, y: 290, tam: 250 },
    { id: "mama", nombre: "Su mamá", rol: "", x: 1520, y: 820, tam: 250 },
  ];

  const HILOS = [
    { id: "maria-valentina", desde: [575, 560], hasta: [825, 565], comba: 45 },
    { id: "valentina-psicologa", desde: [1110, 470], hasta: [1395, 330], comba: -35 },
    { id: "valentina-mama", desde: [1110, 660], hasta: [1395, 790], comba: 35 },
    { id: "maria-psicologa", desde: [470, 385], hasta: [1395, 250], comba: -190, clase: "roto" },
    { id: "maria-mama", desde: [470, 695], hasta: [1395, 870], comba: 190, clase: "roto" },
  ];

  const ORIGEN_OVILLO = 330; // x donde la esfera se vuelve ovillo
  const LOGO = { izquierda: 410, ancho: 1100 };
  let esfera = null;
  let cuadro = null;

  const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const tramo = (t, desde, hasta) => Math.min(Math.max((t - desde) / (hasta - desde), 0), 1);

  function montar(escena) {
    escena.classList.add("apertura");
    escena.innerHTML =
      '<div class="ap-red"><svg class="ap-hilos" viewBox="0 0 1920 1080" aria-hidden="true"></svg>' +
      PERSONAS.map((p) =>
        '<figure class="ap-persona ap-' + p.id + '" style="left:' + (p.x - p.tam / 2) + "px;top:" +
        (p.y - p.tam / 2) + "px;width:" + p.tam + 'px">' +
        '<img src="assets/ilustraciones/' + p.id + '.webp" alt="">' +
        "<figcaption>" + p.nombre + (p.rol ? "<small>" + p.rol + "</small>" : "") + "</figcaption></figure>"
      ).join("") +
      "</div>" +
      '<div class="ap-dato"><p class="ap-numero"><span class="ap-cifra">0</span>%</p>' +
      "<p>de las familias de chicos con autismo tiene problemas para comunicarse</p></div>" +
      '<canvas class="ap-esfera" width="1000" height="1000" aria-hidden="true"></canvas>' +
      '<img class="ap-ovillo" src="assets/ilustraciones/ovillo.webp" alt="">' +
      '<div class="ap-logo"><img src="assets/logo/trama.png" alt="TRAMA"></div>';

    const svg = escena.querySelector(".ap-hilos");
    HILOS.forEach((hilo) => Trama.crearHilo(svg, hilo));
    esfera = Trama.crearEsfera(escena.querySelector(".ap-esfera"));
  }

  function entrar(paso, direccion, escena) {
    for (let i = 1; i <= 7; i++) escena.classList.toggle("p" + i, i <= paso + 1);
    cancelAnimationFrame(cuadro);

    if (paso < 5) {
      esfera.detener();
      reiniciarFinal(escena);
    } else if (paso === 5) {
      reiniciarFinal(escena);
      esfera.aplanar(0);
      esfera.iniciar(direccion > 0);
      contar(escena.querySelector(".ap-cifra"), direccion > 0 ? 1800 : 0);
    } else {
      esfera.iniciar(false);
      if (direccion > 0) animarFinal(escena);
      else dibujarFinal(escena, 99);
    }
  }

  function salir() {
    cancelAnimationFrame(cuadro);
    if (esfera) esfera.detener();
  }

  // El 68 sube contando desde 0.
  function contar(cifra, duracion) {
    const inicio = performance.now();
    function paso(ahora) {
      const t = duracion ? tramo(ahora - inicio, 0, duracion) : 1;
      cifra.textContent = Math.round(68 * (1 - Math.pow(1 - t, 3)));
      if (t < 1) cuadro = requestAnimationFrame(paso);
    }
    cuadro = requestAnimationFrame(paso);
  }

  function animarFinal(escena) {
    const inicio = performance.now();
    function paso(ahora) {
      const t = (ahora - inicio) / 1000;
      dibujarFinal(escena, t);
      if (t < 4.8) cuadro = requestAnimationFrame(paso);
    }
    cuadro = requestAnimationFrame(paso);
  }

  // Estado del paso 7 en el segundo t: esfera que se achica y aplana, ovillo que rueda, logo que aparece.
  function dibujarFinal(escena, t) {
    const lienzoEsfera = escena.querySelector(".ap-esfera");
    const ovillo = escena.querySelector(".ap-ovillo");
    const logo = escena.querySelector(".ap-logo");

    // Primero se achica en su lugar mientras se va el 68 %, después viaja a la izquierda.
    const zoom = suave(tramo(t, 0, 1.4));
    const viaje = suave(tramo(t, 0.5, 1.4));
    esfera.aplanar(zoom);
    lienzoEsfera.style.transform = "translateX(" + -950 * viaje + "px) scale(" + (1 - 0.78 * zoom) + ")";
    lienzoEsfera.style.opacity = 1 - tramo(t, 1.3, 1.6);
    escena.querySelector(".ap-dato").style.opacity = 1 - tramo(t, 0, 0.45);

    const rodar = suave(tramo(t, 1.6, 3.9));
    const x = ORIGEN_OVILLO + 1360 * rodar;
    ovillo.style.opacity = Math.min(tramo(t, 1.3, 1.6), 1 - tramo(x, 1560, 1690));
    ovillo.style.transform =
      "translateX(" + (x - ORIGEN_OVILLO) + "px) rotate(" + ((x - ORIGEN_OVILLO) / (Math.PI * 170)) * 360 + "deg)";

    const visible = Math.min(Math.max(x - LOGO.izquierda, 0), LOGO.ancho);
    logo.style.clipPath = "inset(-40px " + (LOGO.ancho - visible) + "px -40px -40px)";
    logo.classList.toggle("brillando", t >= 3.9);
  }

  function reiniciarFinal(escena) {
    ["ap-esfera", "ap-ovillo", "ap-logo", "ap-dato"].forEach((clase) => {
      const elemento = escena.querySelector("." + clase);
      elemento.style.transform = "";
      elemento.style.opacity = "";
      elemento.style.clipPath = "";
      elemento.classList.remove("brillando");
    });
  }

  Trama.registrarEscena("apertura", { montar, entrar, salir });
})();
