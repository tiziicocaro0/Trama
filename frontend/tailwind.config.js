/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        crema: '#F1E4CD',
        terracota: '#963417',
        oliva: '#4B4F21',
        agua: '#628981',
        miel: '#CF893A',
      },
      fontFamily: {
        // Los <link> de Google Fonts (Patrick Hand y Nunito) están en index.html
        display: ['"Patrick Hand"', '"Comic Sans MS"', 'cursive'],
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
