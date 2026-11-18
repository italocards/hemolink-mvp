/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C1121F',
        primaryLight: '#FFE5E7',
        primaryDark: '#8B0000',
      },
    },
  },
  plugins: [],
}
