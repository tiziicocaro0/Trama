---
name: trama-frontend
description: Implementar, modificar y validar interfaces del frontend de TRAMA con React, JavaScript y Tailwind CSS v4, respetando los mockups, el branding y los componentes existentes.
---

# TRAMA — Desarrollo Frontend

## Objetivo

Desarrollar interfaces web accesibles, responsive, reutilizables y fieles al sistema visual de TRAMA.

## Contexto obligatorio

Antes de comenzar cualquier tarea:

1. Leer `AGENTS.md`.
2. Leer `CONTEXTO.md`.
3. Consultar `docs/branding.md`.
4. Revisar los mockups en `docs/referencias/`.
5. Inspeccionar `frontend/src/styles/tema.css`.
6. Buscar componentes reutilizables en `frontend/src/components/ui/`.

Las instrucciones de `AGENTS.md` y las restricciones del proyecto tienen prioridad sobre esta skill.

## Stack obligatorio

- React con JavaScript y JSX.
- Vite.
- React Router.
- Axios.
- Tailwind CSS v4.
- Vitest.
- React Testing Library.

No introducir TypeScript ni bibliotecas adicionales sin autorización.

## Proceso de implementación

### 1. Analizar

- Identificar el objetivo funcional de la pantalla.
- Analizar el mockup proporcionado.
- Reconocer distribución, jerarquía visual, componentes y estados.
- Revisar si existen componentes equivalentes en el proyecto.

### 2. Planificar

- Enumerar los archivos que será necesario modificar.
- Identificar componentes reutilizables.
- Identificar dependencias con la API.
- Consultar antes de introducir cambios globales o nuevas dependencias.

### 3. Implementar

- Utilizar exclusivamente los tokens de `tema.css`.
- Respetar Handlee y Nunito Sans según la guía.
- Reutilizar el logo y las ilustraciones originales.
- Utilizar componentes existentes siempre que sea posible.
- Mantener los componentes pequeños y reutilizables.
- Separar presentación, lógica y comunicación con la API.
- Implementar navegación con React Router.
- Evitar estilos inline, colores hardcodeados y valores arbitrarios de Tailwind.

### 4. Responsive y accesibilidad

- Implementar layouts adaptables a desktop, tablet y mobile.
- Mantener contraste y legibilidad adecuados.
- Utilizar HTML semántico.
- Asociar labels con inputs.
- Garantizar navegación mediante teclado.
- Incluir estados de foco visibles.
- Considerar estados de carga, error, vacío y deshabilitado.
- No depender exclusivamente del color para comunicar información.

### 5. Integración

- Consumir el backend exclusivamente desde `frontend/src/api/`.
- No inventar endpoints ni contratos.
- Respetar autenticación y permisos existentes.
- No exponer tokens ni datos sensibles.
- Utilizar mocks únicamente cuando sea necesario y mantenerlos separados de la integración real.

### 6. Validación

Antes de finalizar:

- Ejecutar los tests relevantes.
- Ejecutar `npm run lint`.
- Ejecutar `npm run check:estilos`.
- Verificar que la aplicación compile.
- Comparar visualmente la pantalla con el mockup cuando haya herramientas disponibles.
- No afirmar que una validación pasó si no pudo ejecutarse.

## Entrega

Al terminar cada tarea, informar:

1. Qué se implementó.
2. Qué archivos se modificaron.
3. Cómo probar la funcionalidad.
4. Qué queda pendiente o necesita confirmación.

No modificar archivos ajenos a la tarea ni cambiar el sistema visual global sin autorización.