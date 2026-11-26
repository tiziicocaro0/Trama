/*
 * Motor de la presentación: escena y paso actuales, avance automático y modo práctica.
 *
 * Controles:
 * - Avanzar: clic en los dos tercios derechos, flecha derecha o abajo, Avanzar página o Enter.
 * - Retroceder: clic en el tercio izquierdo, flecha izquierda o arriba, Retroceder página o Backspace.
 * - Espacio: pausar o reanudar el avance automático.
 * - P: modo práctica (barra roja arriba con el tiempo de la pantalla y del pitch).
 * - F: pantalla completa. Inicio y Fin: primera y última pantalla.
 * - La URL guarda la posición (#2.3 = pantalla 2, paso 3).
 *
 * Cada paso dura lo que dice su "duracion" en escenas.js y después avanza solo. Un paso con
 * duracion null espera un clic (por ejemplo, el cartel antes del comercial).
 *
 * Todo se dibuja en un lienzo fijo de 1920 × 1080 que se escala a la ventana, así las posiciones
 * son las mismas en cualquier pantalla.
 *
 * Una escena animada se registra con Trama.registrarEscena(id, { montar, entrar, salir }):
 * Con continua: true la escena entra sin fundido al avanzar (sigue la imagen de la anterior).
 * montar(elemento) arma su contenido una vez, entrar(paso, direccion, elemento) se llama en cada
 * paso y salir(elemento) al dejarla. Las escenas sin registro muestran su texto provisorio.
 */
window.Trama = window.Trama || {};

(function () {
  const ANCHO = 1920;
  const ALTO = 1080;
  const animaciones = {};
  const estado = { escena: 0, paso: 0, inicioPaso: 0, restante: null, pausado: false };
  let temporizador = null;
  let lienzo, barra, practica;

  Trama.registrarEscena = function (id, animacion) {
    animaciones[id] = animacion;
  };

  // Fondo oscuro (rojo): lo pide una escena; cambia el fondo de toda la ventana, incluidos los
  // costados, e invierte los colores de los puntos de avance y del modo práctica.
  Trama.fondoOscuro = function (activo) {
    document.body.classList.toggle("fondo-oscuro", activo);
  };

  const escenaActual = () => Trama.escenas[estado.escena];
  const totalPasos = (indice) => Trama.escenas[indice].pasos.length;
  const duracionPaso = (escena, paso) => Trama.escenas[escena].pasos[paso].duracion;
  const duracionEscena = (escena) =>
    Trama.escenas[escena].pasos.reduce((suma, paso) => suma + (paso.duracion || 0), 0);

  function avanzar() {
    if (estado.paso < totalPasos(estado.escena) - 1) {
      irA(estado.escena, estado.paso + 1, 1);
    } else if (estado.escena < Trama.escenas.length - 1) {
      irA(estado.escena + 1, 0, 1);
    }
  }

  function retroceder() {
    if (estado.paso > 0) {
      irA(estado.escena, estado.paso - 1, -1);
    } else if (estado.escena > 0) {
      irA(estado.escena - 1, totalPasos(estado.escena - 1) - 1, -1);
    }
  }

  function irA(escena, paso, direccion) {
    const cambiaDeEscena = escena !== estado.escena || !lienzo.firstChild;
    if (cambiaDeEscena && lienzo.firstChild) {
      const anterior = animaciones[escenaActual().id];
      if (anterior && anterior.salir) anterior.salir(lienzo.firstChild);
    }

    estado.escena = escena;
    estado.paso = paso;
    history.replaceState(null, "", "#" + (escena + 1) + "." + (paso + 1));

    if (cambiaDeEscena) montarEscena(direccion);
    mostrarPaso(direccion);
    programarAvance(duracionPaso(escena, paso));
    actualizarBarra();
  }

  function montarEscena(direccion) {
    const datos = escenaActual();
    const animacion = animaciones[datos.id];
    const elemento = document.createElement("section");
    Trama.fondoOscuro(false);
    practica.querySelector(".practica-orador").textContent = datos.fueraDelPitch
      ? datos.titulo + " (fuera del pitch)"
      : "Presenta " + datos.orador.split(" · ")[0] + " · " + datos.titulo;
    // Una escena "continua" arranca donde terminó la anterior: al avanzar no hace fundido.
    elemento.className = animacion && animacion.continua && direccion > 0 ? "escena" : "escena entrando";
    elemento.dataset.escena = datos.id;
    elemento.style.setProperty("--desde", direccion < 0 ? "-80px" : "80px");

    if (animacion && animacion.montar) {
      animacion.montar(elemento);
    } else {
      elemento.classList.add("provisoria");
      elemento.innerHTML =
        '<p class="escena-etiqueta">Pantalla ' + (estado.escena + 1) + " · " + datos.titulo + "</p>" +
        '<p class="escena-orador">' + datos.orador + "</p>" +
        '<p class="escena-provisorio"></p><p class="escena-paso"></p>';
    }

    lienzo.replaceChildren(elemento);
    requestAnimationFrame(() => elemento.classList.remove("entrando"));
  }

  function mostrarPaso(direccion) {
    const datos = escenaActual();
    const elemento = lienzo.firstChild;
    const animacion = animaciones[datos.id];

    if (animacion && animacion.entrar) {
      animacion.entrar(estado.paso, direccion, elemento);
      return;
    }

    const texto = elemento.querySelector(".escena-provisorio");
    texto.classList.remove("cambiando");
    void texto.offsetWidth; // reinicia la animación del texto en cada paso
    texto.classList.add("cambiando");
    texto.textContent = "Acá va: " + datos.pasos[estado.paso].texto;
    elemento.querySelector(".escena-paso").textContent =
      "Paso " + (estado.paso + 1) + " de " + datos.pasos.length;
  }

  // Avance automático: cada paso sigue al siguiente cuando se cumple su duración.
  function programarAvance(segundos) {
    clearTimeout(temporizador);
    estado.inicioPaso = performance.now();
    estado.restante = segundos == null ? null : segundos * 1000;
    if (estado.restante != null && !estado.pausado) {
      temporizador = setTimeout(avanzar, estado.restante);
    }
  }

  function alternarPausa() {
    if (estado.pausado) {
      estado.pausado = false;
      estado.inicioPaso = performance.now() - (duracionMs() - estado.restante);
      if (estado.restante != null) temporizador = setTimeout(avanzar, estado.restante);
    } else {
      estado.pausado = true;
      clearTimeout(temporizador);
      if (estado.restante != null) estado.restante = Math.max(duracionMs() - transcurridoPaso(), 0);
    }
    document.body.classList.toggle("pausado", estado.pausado);
  }

  const duracionMs = () => (duracionPaso(estado.escena, estado.paso) || 0) * 1000;

  function transcurridoPaso() {
    if (estado.pausado) return duracionMs() - (estado.restante || 0);
    return performance.now() - estado.inicioPaso;
  }

  // Modo práctica: barra roja con el avance de la pantalla y el tiempo total del pitch.
  function dibujarPractica() {
    if (document.body.classList.contains("practicando")) {
      const escena = estado.escena;
      let antes = 0;
      for (let paso = 0; paso < estado.paso; paso++) antes += duracionPaso(escena, paso) || 0;
      const enPantalla = antes + Math.min(transcurridoPaso(), duracionMs()) / 1000;
      const totalPantalla = duracionEscena(escena);

      let pitch = enPantalla;
      let totalPitch = 0;
      Trama.escenas.forEach((datos, indice) => {
        if (datos.fueraDelPitch) return;
        totalPitch += duracionEscena(indice);
        if (indice < escena) pitch += duracionEscena(indice);
      });
      if (escenaActual().fueraDelPitch) pitch = 0;

      practica.querySelector(".practica-relleno").style.width =
        (totalPantalla ? (enPantalla / totalPantalla) * 100 : 0) + "%";
      practica.querySelector(".practica-texto").textContent =
        escenaActual().titulo + " · " + Math.floor(enPantalla) + " s de " + totalPantalla + " s" +
        " · Pitch " + reloj(pitch) + " de " + reloj(totalPitch) + (estado.pausado ? " · En pausa" : "");
    }
    requestAnimationFrame(dibujarPractica);
  }

  const reloj = (segundos) =>
    Math.floor(segundos / 60) + ":" + String(Math.floor(segundos % 60)).padStart(2, "0");

  function armarBarra() {
    barra.replaceChildren(
      ...Trama.escenas.map((datos, indice) => {
        const punto = document.createElement("span");
        punto.className = "barra-punto";
        punto.title = indice + 1 + " · " + datos.titulo;
        return punto;
      })
    );
  }

  function actualizarBarra() {
    [...barra.children].forEach((punto, indice) => {
      punto.classList.toggle("hecho", indice < estado.escena);
      punto.classList.toggle("actual", indice === estado.escena);
    });
  }

  function escalar() {
    const escala = Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO);
    document.documentElement.style.setProperty("--escala", escala);
  }

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  function alPresionarTecla(evento) {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
    const acciones = {
      ArrowRight: avanzar, ArrowDown: avanzar, PageDown: avanzar, Enter: avanzar,
      ArrowLeft: retroceder, ArrowUp: retroceder, PageUp: retroceder, Backspace: retroceder,
      " ": alternarPausa,
      f: alternarPantallaCompleta, F: alternarPantallaCompleta,
      p: () => document.body.classList.toggle("practicando"),
      P: () => document.body.classList.toggle("practicando"),
      Home: () => irA(0, 0, -1),
      End: () => irA(Trama.escenas.length - 1, 0, 1),
    };
    const accion = acciones[evento.key];
    if (accion) {
      evento.preventDefault();
      accion();
    }
  }

  function alHacerClic(evento) {
    if (evento.button !== 0) return;
    if (evento.clientX < window.innerWidth / 3) retroceder();
    else avanzar();
  }

  // El cursor se esconde a los 2 s sin moverse, para que no quede sobre la proyección.
  function esconderCursorSiNoSeMueve() {
    let espera;
    document.addEventListener("mousemove", () => {
      document.body.classList.remove("sin-cursor");
      clearTimeout(espera);
      espera = setTimeout(() => document.body.classList.add("sin-cursor"), 2000);
    });
  }

  // F5 (o Ctrl+R) vuelve al comienzo; el #escena.paso de la URL solo se respeta al abrir un enlace.
  function posicionDesdeLaUrl() {
    const navegacion = performance.getEntriesByType("navigation")[0];
    if (navegacion && navegacion.type === "reload") return [0, 0];
    const [escena, paso] = location.hash.replace("#", "").split(".").map(Number);
    const indiceEscena = Math.min(Math.max((escena || 1) - 1, 0), Trama.escenas.length - 1);
    const indicePaso = Math.min(Math.max((paso || 1) - 1, 0), totalPasos(indiceEscena) - 1);
    return [indiceEscena, indicePaso];
  }

  document.addEventListener("DOMContentLoaded", () => {
    lienzo = document.getElementById("lienzo");
    barra = document.getElementById("barra");
    practica = document.getElementById("practica");
    escalar();
    window.addEventListener("resize", escalar);
    armarBarra();

    const [escena, paso] = posicionDesdeLaUrl();
    irA(escena, paso, 1);

    document.addEventListener("keydown", alPresionarTecla);
    document.getElementById("zona-clic").addEventListener("click", alHacerClic);
    esconderCursorSiNoSeMueve();
    requestAnimationFrame(dibujarPractica);
  });
})();
