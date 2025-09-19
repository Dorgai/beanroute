/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  safelist: [
    // Dark mode classes that need to be included
    'dark:bg-dark-bg',
    'dark:text-gray-100',
    'dark:text-gray-300',
    'dark:text-gray-400',
    'dark:bg-dark-container',
    'dark:bg-dark-table',
    'dark:border-dark-border',
    'dark:divide-gray-600',
    'dark:bg-blue-500',
    'dark:hover:bg-gray-600',
    'dark:bg-gray-700',
    'dark:text-blue-400',
    'dark:hover:text-blue-300',
    'dark:bg-red-900',
    'dark:border-red-700',
    'dark:text-red-200',
    'dark:bg-green-900',
    'dark:text-green-200',
    'dark:bg-red-100',
    'dark:text-red-800',
    'dark:bg-green-100',
    'dark:text-green-800',
    // Additional dark mode classes
    'dark:bg-gray-900',
    'dark:bg-gray-800',
    'dark:bg-gray-600',
    'dark:text-white',
    'dark:text-gray-200',
    'dark:text-gray-500',
    'dark:border-gray-600',
    'dark:border-gray-700',
    'dark:hover:bg-gray-700',
    'dark:bg-blue-900',
    'dark:text-blue-200',
    'dark:text-blue-300',
    'dark:bg-red-800',
    'dark:text-red-300',
    'dark:bg-green-800',
    'dark:text-green-300',
    'dark:bg-orange-900',
    'dark:text-orange-200',
    'dark:bg-purple-900',
    'dark:text-purple-200',
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
        // Dark theme colors
        dark: {
          bg: '#1f2937',      // Page background
          container: '#374151', // Container background
          table: '#4b5563',   // Table background
          border: '#6b7280',  // Borders
        }
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
        },
      }
      addUtilities(newUtilities)
    }
  ],
};