/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  future: {
    // Los efectos :hover solo se aplican en dispositivos que lo soportan.
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      screens: {
        // Breakpoint del diseño de referencia: layout desktop desde 860px.
        desk: '860px',
      },
      colors: {
        crema: '#F1E4CD',
        terracota: '#963417',
        oliva: '#4B4F21',
        agua: '#628981',
        miel: '#CF893A',
        // Tonos de apoyo para superficies, bordes y textos.
        'crema-claro': '#F3E7D1',
        'crema-oscuro': '#EFE0C6',
        'crema-card': '#FFFCF7',
        'crema-tab': '#F3EEE5',
        borde: '#EAE3D8',
        texto: '#514A40',
        'texto-suave': '#918779',
      },
      fontFamily: {
        // Identidad: logotipo, títulos de pantalla, secciones y nombres propios destacados.
        display: ['Handlee', 'cursive'],
        // Interfaz: cuerpo, subtítulos, botones, inputs, metadata y fechas.
        sans: ['"Nunito Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['48px', { fontWeight: '400' }], // Handlee
        h1: ['36px', { fontWeight: '400' }], // Handlee
        h2: ['28px', { fontWeight: '400' }], // Handlee
        subtitle: ['20px', { fontWeight: '600' }], // Nunito Sans
        body: ['16px', { fontWeight: '400' }], // Nunito Sans
        small: ['14px', { fontWeight: '400' }], // Nunito Sans
        caption: ['12px', { fontWeight: '400' }], // Nunito Sans
      },
      boxShadow: {
        suave: '0 2px 10px rgba(81, 74, 64, 0.04)',
        'suave-lg': '0 3px 14px rgba(81, 74, 64, 0.05)',
        panel: '0 4px 16px rgba(81, 74, 64, 0.05)',
        elevada: '0 8px 22px rgba(81, 74, 64, 0.09)',
      },
    },
  },
  plugins: [],
};
