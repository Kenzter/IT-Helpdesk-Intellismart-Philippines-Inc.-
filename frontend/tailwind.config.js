/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Public Sans", "system-ui", "sans-serif"] },
      colors: {
        paper: "#f5f7fb",
        ink: "#18233a",
        // Blue: navigation, links, headings
        brand: { DEFAULT: "#1f4e9c", dark: "#163a75", soft: "#e8f0fc" },
        // Orange: buttons and highlights
        accent: { DEFAULT: "#c84b0a", dark: "#a33c06", soft: "#fdeee2", bright: "#f58220" },
      },
    },
  },
  plugins: [],
};
