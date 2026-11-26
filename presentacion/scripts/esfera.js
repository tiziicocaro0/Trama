/*
 * Esfera de nodos unidos por hilos, en 3D, dibujada en un canvas.
 *
 * Los nodos se reparten sobre una esfera (espiral de Fibonacci) y cada uno se une con sus vecinos
 * más cercanos. La esfera gira sola y se proyecta con perspectiva: lo que está adelante se ve más
 * grande y más opaco.
 *
 * aplanar(t) la deforma hacia un círculo plano (t = 0 esfera, t = 1 disco con los colores del
 * ovillo), para la transición en la que la información dispersa se convierte en TRAMA.
 */
window.Trama = window.Trama || {};

(function () {
  const COLORES = ["#963417", "#CF893A", "#628981", "#4B4F21", "#E3A632"];

  Trama.crearEsfera = function (canvas, { nodos = 72, vecinos = 3, radio = 360 } = {}) {
    const contexto = canvas.getContext("2d");
    const puntos = [];
    const uniones = [];
    let angulo = 0;
    let aplanado = 0;
    let aparicion = 0;
    let cuadro = null;
    let ultimo = 0;

    // Espiral de Fibonacci: reparte los puntos de forma pareja sobre la esfera.
    for (let i = 0; i < nodos; i++) {
      const y = 1 - (i / (nodos - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = i * Math.PI * (3 - Math.sqrt(5));
      puntos.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r, color: COLORES[i % COLORES.length] });
    }

    puntos.forEach((punto, i) => {
      puntos
        .map((otro, j) => ({ j, distancia: Math.hypot(punto.x - otro.x, punto.y - otro.y, punto.z - otro.z) }))
        .filter(({ j }) => j > i)
        .sort((a, b) => a.distancia - b.distancia)
        .slice(0, vecinos)
        .forEach(({ j }) => uniones.push([i, j]));
    });

    function proyectar(punto) {
      const coseno = Math.cos(angulo);
      const seno = Math.sin(angulo);
      let x = punto.x * coseno - punto.z * seno;
      let z = punto.x * seno + punto.z * coseno;
      let y = punto.y * Math.cos(0.35) - z * Math.sin(0.35);
      z = punto.y * Math.sin(0.35) + z * Math.cos(0.35);

      z *= 1 - aplanado; // al aplanar, la profundidad desaparece y queda un disco
      const perspectiva = 2.6 / (2.6 + z);
      return {
        x: canvas.width / 2 + x * radio * perspectiva,
        y: canvas.height / 2 + y * radio * perspectiva,
        profundidad: (z + 1) / 2,
        escala: perspectiva,
      };
    }

    function dibujar(tiempo) {
      const delta = ultimo ? Math.min(tiempo - ultimo, 50) : 16;
      ultimo = tiempo;
      angulo += delta * 0.00025 * (1 + aplanado * 6);
      aparicion = Math.min(aparicion + delta / 1400, 1);

      contexto.clearRect(0, 0, canvas.width, canvas.height);
      const proyectados = puntos.map(proyectar);
      const visibles = Math.floor(aparicion * puntos.length);

      contexto.lineCap = "round";
      uniones.forEach(([a, b]) => {
        if (a >= visibles || b >= visibles) return;
        const pa = proyectados[a];
        const pb = proyectados[b];
        const cerca = (pa.profundidad + pb.profundidad) / 2;
        contexto.strokeStyle = aplanado > 0.5 ? "#E3A632" : "#CF893A";
        contexto.globalAlpha = 0.15 + (1 - cerca) * 0.55;
        contexto.lineWidth = 2 + aplanado * 4;
        contexto.beginPath();
        contexto.moveTo(pa.x, pa.y);
        contexto.lineTo(pb.x, pb.y);
        contexto.stroke();
      });

      proyectados
        .map((p, i) => ({ ...p, i }))
        .filter(({ i }) => i < visibles)
        .sort((a, b) => b.profundidad - a.profundidad)
        .forEach((p) => {
          contexto.globalAlpha = (0.35 + (1 - p.profundidad) * 0.65) * (1 - aplanado * 0.6);
          contexto.fillStyle = puntos[p.i].color;
          contexto.beginPath();
          contexto.arc(p.x, p.y, (9 + (1 - p.profundidad) * 8) * p.escala, 0, Math.PI * 2);
          contexto.fill();
        });
      contexto.globalAlpha = 1;

      cuadro = requestAnimationFrame(dibujar);
    }

    return {
      iniciar(desdeCero = true) {
        if (desdeCero) aparicion = 0;
        if (!cuadro) {
          ultimo = 0;
          cuadro = requestAnimationFrame(dibujar);
        }
      },
      detener() {
        cancelAnimationFrame(cuadro);
        cuadro = null;
      },
      aplanar(t) {
        aplanado = Math.min(Math.max(t, 0), 1);
      },
    };
  };
})();
