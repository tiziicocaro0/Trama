/*
 * Motor de la presentación: lleva la cuenta de la escena y el paso actuales y decide qué se ve.
 *
 * Controles:
 * - Avanzar: clic en los dos tercios derechos, flecha derecha o abajo, Avanzar página, espacio o Enter.
 * - Retroceder: clic en el tercio izquierdo, flecha izquierda o arriba, Retroceder página o Backspace.
 * - F: pantalla completa. Inicio y Fin: primera y última pantalla.
 * - La URL guarda la posición (#2.3 = pantalla 2, paso 3): al recargar se vuelve al mismo lugar.
 *
 * Una escena con animación propia se registra con Trama.registrarEscena(id, { entrar, salir }).
 * entrar(paso, direccion, elemento) se llama en cada paso; salir(elemento) al dejar la escena.
 * Las escenas sin registro muestran el texto provisorio de scripts/escenas.js.
 */
window.Trama = window.Trama || {};

(function () {
  const animaciones = {};
  const estado = { escena: 0, paso: 0 };
  let escenario;
  let barra;

  Trama.registrarEscena = function (id, animacion) {
    animaciones[id] = animacion;
  };

  function escenaActual() {
    return Trama.escenas[estado.escena];
  }

  function totalPasos(indice) {
    return Trama.escenas[indice].pasos.length;
  }

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
    const cambiaDeEscena = escena !== estado.escena || !escenario.firstChild;
    if (cambiaDeEscena && escenario.firstChild) {
      const anterior = animaciones[escenaActual().id];
      if (anterior && anterior.salir) anterior.salir(escenario.firstChild);
    }

    estado.escena = escena;
    estado.paso = paso;
    history.replaceState(null, "", "#" + (escena + 1) + "." + (paso + 1));

    if (cambiaDeEscena) montarEscena(direccion);
    mostrarPaso(direccion);
    actualizarBarra();
  }

  function montarEscena(direccion) {
    const datos = escenaActual();
    const elemento = document.createElement("section");
    elemento.className = "escena entrando";
    elemento.dataset.escena = datos.id;
    elemento.style.setProperty("--desde", direccion < 0 ? "-4vw" : "4vw");
    elemento.innerHTML =
      '<p class="escena-etiqueta">Pantalla ' + (estado.escena + 1) + " · " + datos.titulo + "</p>" +
      '<p class="escena-orador">' + datos.orador + "</p>" +
      '<p class="escena-provisorio" aria-live="polite"></p>' +
      '<p class="escena-paso"></p>';

    escenario.replaceChildren(elemento);
    requestAnimationFrame(() => elemento.classList.remove("entrando"));
  }

  function mostrarPaso(direccion) {
    const datos = escenaActual();
    const elemento = escenario.firstChild;
    const animacion = animaciones[datos.id];

    if (animacion && animacion.entrar) {
      animacion.entrar(estado.paso, direccion, elemento);
      return;
    }

    const texto = elemento.querySelector(".escena-provisorio");
    texto.classList.remove("cambiando");
    void texto.offsetWidth; // reinicia la animación del texto en cada paso
    texto.classList.add("cambiando");
    texto.textContent = "Acá va: " + datos.pasos[estado.paso];
    elemento.querySelector(".escena-paso").textContent =
      "Paso " + (estado.paso + 1) + " de " + datos.pasos.length;
  }

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

  function alternarPantallaCompleta() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }

  function alPresionarTecla(evento) {
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;

    const acciones = {
      ArrowRight: avanzar, ArrowDown: avanzar, PageDown: avanzar, " ": avanzar, Enter: avanzar,
      ArrowLeft: retroceder, ArrowUp: retroceder, PageUp: retroceder, Backspace: retroceder,
      f: alternarPantallaCompleta, F: alternarPantallaCompleta,
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
    if (evento.clientX < window.innerWidth / 3) {
      retroceder();
    } else {
      avanzar();
    }
  }

  // El cursor se esconde a los 2 s sin moverse, para que no quede sobre la proyección.
  function esconderCursorSiNoSeMueve() {
    let temporizador;
    document.addEventListener("mousemove", () => {
      document.body.classList.remove("sin-cursor");
      clearTimeout(temporizador);
      temporizador = setTimeout(() => document.body.classList.add("sin-cursor"), 2000);
    });
  }

  function posicionDesdeLaUrl() {
    const [escena, paso] = location.hash.replace("#", "").split(".").map(Number);
    const indiceEscena = Math.min(Math.max((escena || 1) - 1, 0), Trama.escenas.length - 1);
    const indicePaso = Math.min(Math.max((paso || 1) - 1, 0), totalPasos(indiceEscena) - 1);
    return [indiceEscena, indicePaso];
  }

  document.addEventListener("DOMContentLoaded", () => {
    escenario = document.getElementById("escenario");
    barra = document.getElementById("barra");
    armarBarra();

    const [escena, paso] = posicionDesdeLaUrl();
    irA(escena, paso, 1);

    document.addEventListener("keydown", alPresionarTecla);
    document.getElementById("zona-clic").addEventListener("click", alHacerClic);
    esconderCursorSiNoSeMueve();
  });
})();
