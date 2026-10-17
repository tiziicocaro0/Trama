# TRAMA — Sistema visual

**Identidad:** cálida, cercana, clara, humana. Concepto: «Distintas miradas, una misma persona». Recursos distintivos: hilos y ovillo; usar los recursos gráficos originales y evitar decoraciones que dificulten la lectura.

## Colores oficiales
| Token | Hex | Uso |
|---|---|---|
| crema | #F1E4CD | fondo principal |
| terracota | #963417 | acciones primarias, títulos y elementos destacados |
| oliva | #4B4F21 | títulos secundarios, apoyo y navegación |
| agua | #628981 | detalles, iconos, acentos suaves |
| miel | #CF893A | detalles secundarios |
| texto | #2E2E2E | texto principal |
| texto-suave | #6B6B6B | texto secundario |
| borde | #D9D4C8 | bordes, divisores |
| exito | #4A7C59 | confirmaciones |
| error | #B0413E | errores y acciones críticas |
| aviso | #E3A632 | advertencias |

La crema y el agua pueden requerir ajustes de contraste para texto pequeño. No utilizar miel o agua como texto pequeño sin verificar WCAG AA. Los blancos cálidos de las tarjetas en capturas son referencias visuales; validar su valor exacto antes de añadir un nuevo token.

## Tipografía
- **Handlee:** logo, display, títulos principales y elementos expresivos. No usar en párrafos largos, formularios, botones ni tablas.
- **Nunito Sans:** cuerpo, subtítulos funcionales, botones, formularios, tablas, mensajes, etiquetas.
- Escala de referencia: display 48px; H1 36px; H2 28px; subtítulo 20px; body 16px; small 14px; caption 12px. Adaptar tamaños a viewport conservando jerarquía.
- Importar las fuentes con licencia válida o desde una fuente autorizada. El logo se muestra como imagen original, no como texto Handlee.

## Espaciado, bordes y sombras
- Espaciado base: 4, 8, 12, 16, 24, 32px. Utilizar tokens o utilidades Tailwind equivalentes.
- Radios: 8px pequeños, 16px medianos, 24px tarjetas principales, 999px pills/avatares.
- Sombras suaves para tarjetas y controles; elevadas solo para overlays. No añadir sombras fuertes genéricas.

## Componentes y estados
- Botón primario: fondo terracota, texto claro, hover más oscuro, foco visible, deshabilitado con contraste suficiente.
- Botón secundario: contorno terracota, fondo transparente/cálido, hover sutil.
- Botón peligro: terracota/rojo de acción crítica según contexto.
- Inputs: fondo claro, borde neutro, icono agua, focus destacado y error en token error con texto explicativo.
- Cards: fondo cálido claro, radios amplios, sombra suave; hover y seleccionado discernibles.
- Alerts: éxito, error, aviso; siempre acompañar color con icono y texto.
- Modales: confirmación y decisiones importantes; foco gestionado y cierre accesible.
- Íconos: Phosphor Icons de trazo simple y redondeado, tamaños 16, 20, 24, 32px, consistente en cada contexto.

## Accesibilidad
- Objetivo WCAG 2.1 AA, contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande.
- Objetivos táctiles cómodos (ideal 44x44px), foco visible, labels explícitas, errores descriptivos.
- No depender únicamente de color para comunicar estado.
- No incrustar texto funcional dentro de imágenes cuando pueda renderizarse como HTML accesible.

## Recursos y pantallas
- Logo: `/assets/branding/logo-trama.png`.
- Ovillo: `/assets/branding/ovillo.png`.
- Capturas: `docs/referencias/07-bienvenida.png`, `08-registro.png`, `09-login.png`, `10-dashboard.png`, `11-acompanamientos.png`.
- Las capturas son la referencia de composición, pero no deben implementarse como fondos de pantalla completos: recrear UI real con componentes HTML semánticos y Tailwind.
- En registro, los pasos Datos/Seguridad/Perfil deben respetar los requerimientos del backend; no inferir campos obligatorios solo de la captura.
- Para datos de acompañamientos, utilizar mocks aislados hasta disponer de contratos reales de API.
