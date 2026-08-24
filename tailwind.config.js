/** Configuracion de Tailwind para "Oficina del Entrenador".
 *  Regenerar css/styles.css tras cambiar esta config o anadir clases
 *  nuevas en index.html / js/app.js: `npm run css:build` (ver README.md). */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  theme: {
    extend: {
      colors: {
        base:      '#0A100D',
        panel:     '#0F1B14',
        card:      '#152018',
        cardhover: '#1B2A21',
        turf:      '#3FA34D',
        turfdark:  '#245C33',
        turfline:  '#2E7A3D',
        gold:      '#C9A227',
        ink:       '#E9EDE9',
        muted:     '#7E8D82',
        border:    '#22301F',
      },
      fontFamily: {
        display: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
};
