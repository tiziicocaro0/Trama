# Presentación · UADE Startup

Presentación animada del pitch de TRAMA. Es una página web autónoma: no usa el front, no necesita
instalar nada y funciona sin internet. Se puede mover o borrar sin afectar el resto del repo.

## Cómo abrirla

Doble clic en `presentacion/index.html` (Chrome o Edge). Después, `F` para pantalla completa.

## Controles

| Acción | Cómo |
| --- | --- |
| Avanzar | Clic en el centro o a la derecha · flecha derecha o abajo · espacio · Enter · clicker |
| Retroceder | Clic en el tercio izquierdo · flecha izquierda o arriba · Backspace · clicker |
| Pantalla completa | `F` |
| Primera / última pantalla | Inicio / Fin |
| Ir a una pantalla | Agregar `#3.2` a la URL (pantalla 3, paso 2). Al recargar se mantiene la posición |

El cursor se esconde solo a los 2 segundos sin mover el mouse.

## Estructura

| Archivo | Qué tiene |
| --- | --- |
| `index.html` | La página |
| `scripts/escenas.js` | El guion: pantallas, orador, tiempo y un texto por paso (un paso = un clic) |
| `scripts/motor.js` | Navegación: clics, teclado, pantalla completa y posición en la URL |
| `estilos/tema.css` | Copia de los colores y tipografías de TRAMA (`frontend/src/styles/tema.css`) |
| `estilos/presentacion.css` | Escenario y transiciones |
| `assets/fuentes/` | Handlee y Nunito Sans locales, con su licencia OFL |
| `assets/videos/` | `comercial.mp4`, `celular.mp4` y `demo.mp4`. **No se suben a git**: se comparten por Drive |

## Agregar la animación de una pantalla

Cada pantalla muestra por ahora un texto provisorio. Para animarla, crear `scripts/escenas/<id>.js`,
sumarlo al `index.html` después de `motor.js` y registrarla:

```js
Trama.registrarEscena("apertura", {
  entrar(paso, direccion, elemento) { /* qué se ve en ese paso; direccion es 1 o -1 */ },
  salir(elemento) { /* limpiar temporizadores o animaciones */ },
});
```
