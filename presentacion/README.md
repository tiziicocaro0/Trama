# Presentación · UADE Startup

Presentación animada del pitch de TRAMA. Es una página web autónoma: no usa el front, no necesita
instalar nada y funciona sin internet. Se puede mover o borrar sin afectar el resto del repo.

## Cómo abrirla

Doble clic en `presentacion/index.html` (Chrome o Edge). Después, `F` para pantalla completa.

## Controles

| Acción | Cómo |
| --- | --- |
| Avanzar | Clic en el centro o a la derecha · flecha derecha o abajo · Enter · clicker |
| Retroceder | Clic en el tercio izquierdo · flecha izquierda o arriba · Backspace · clicker |
| Pausar o reanudar el avance automático | Espacio |
| Modo práctica | `P`: barra roja arriba con el tiempo de la pantalla y del pitch (8 min sin el comercial), y abajo a la izquierda quién presenta |
| Pantalla completa | `F` |
| Primera / última pantalla | Inicio / Fin |
| Ir a una pantalla | Agregar `#3.2` a la URL (pantalla 3, paso 2). F5 vuelve siempre al comienzo |

El cursor se esconde solo a los 2 segundos sin mover el mouse.

**Avance automático:** cada paso dura lo que dice su `duracion` en `scripts/escenas.js` y pasa solo
al siguiente. Solo el cartel del comercial espera un clic. Las duraciones salen del guion (unas
2,5 palabras por segundo): después de ensayar con `P`, ajústenlas ahí.

## Estructura

| Archivo | Qué tiene |
| --- | --- |
| `index.html` | La página |
| `scripts/escenas.js` | El guion: pantallas, orador y pasos con su texto y su duración |
| `scripts/motor.js` | Navegación, avance automático, pausa, modo práctica y lienzo de 1920 × 1080 |
| `scripts/hilo.js` | Hilos de lana en SVG que se dibujan solos |
| `scripts/esfera.js` | Esfera de nodos en 3D (canvas) que se puede aplanar |
| `scripts/escenas/apertura.js` | Pantalla 2: la red de María, el 68 % y el logo |
| `scripts/escenas/producto.js` | Pantalla 3: temas, la red de personas, la pregunta y la balanza |
| `estilos/tema.css` | Copia de los colores y tipografías de TRAMA (`frontend/src/styles/tema.css`) |
| `estilos/presentacion.css` | Escenario, transiciones y modo práctica |
| `estilos/apertura.css` | Animaciones de la pantalla 2 |
| `estilos/producto.css` | Pantalla 3, pasos 1 a 4: logo, temas, la red y el fundido a rojo |
| `estilos/producto-cierre.css` | Pantalla 3, pasos 4 a 6: la pregunta, chat y planilla, y la balanza |
| `estilos/logo-mascara.css` | Silueta del logo embebida, para el brillo (Chrome bloquea máscaras locales en `file://`) |
| `assets/ilustraciones/` | Recortes provisorios de las ilustraciones del Canva y el ovillo |
| `assets/fuentes/` | Handlee y Nunito Sans locales, con su licencia OFL |
| `assets/videos/` | `comercial.mp4`, `celular.mp4` y `demo.mp4`. **No se suben a git**: se comparten por Drive |

## Agregar la animación de una pantalla

Las pantallas sin animación muestran un texto provisorio. Para animar una, crear
`scripts/escenas/<id>.js` (y su CSS), sumarlos al `index.html` y registrarla:

```js
Trama.registrarEscena("producto", {
  montar(elemento) { /* arma el contenido una vez, en coordenadas de 1920 × 1080 */ },
  entrar(paso, direccion, elemento) { /* qué se ve en ese paso; direccion es 1 o -1 */ },
  salir(elemento) { /* corta animaciones y temporizadores */ },
});
```

Conviene que cada paso sea un estado (clases CSS acumulativas `p1`, `p2`…), así retroceder lo
deshace solo. `apertura.js` es el ejemplo.

Para un paso con fondo rojo, la escena llama a `Trama.fondoOscuro(true)`: pinta toda la ventana
(también los costados) e invierte los colores de los puntos de avance y del modo práctica. Al
cambiar de pantalla se apaga solo.
