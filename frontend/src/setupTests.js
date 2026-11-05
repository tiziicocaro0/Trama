import '@testing-library/jest-dom/vitest';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import AvisosFlotantes from './components/avisos/AvisosFlotantes.jsx';
import { limpiarAvisos } from './components/avisos/avisosFlotantes.js';

// Igual que en App: los avisos flotantes están siempre montados, así cada test
// puede buscar el "Guardamos…" o el error que dispara una pantalla.
beforeEach(() => {
  render(createElement(AvisosFlotantes));
});

afterEach(() => {
  cleanup();
  limpiarAvisos();
  localStorage.clear();
  sessionStorage.clear();
});
