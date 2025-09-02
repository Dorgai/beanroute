/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#0066ff',
          600: '#005ce6',
          700: '#0047b3',
          800: '#003380',
          900: '#001a40',
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'nav-height': '4rem',
      },
      zIndex: {
        'nav': '50',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.pb-safe': {
          'padding-bottom': 'calc(4rem + env(safe-area-inset-bottom))',
        },
        '.bottom-nav': {
          'position': 'fixed',
          'bottom': '0',
          'left': '0',
          'right': '0',
          'background': 'white',
          'border-top': '1px solid #e5e7eb',
          'z-index': '50',
          'box-shadow': '0 -2px 10px rgba(0, 0, 0, 0.1)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
}; 