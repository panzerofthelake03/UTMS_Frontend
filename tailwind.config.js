/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // disable auto dark mode
  theme: {
    extend: {
      colors: {
        iyte: {
          DEFAULT: '#8b1a1a',
          dark:    '#6b1414',
          light:   '#a52020',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
