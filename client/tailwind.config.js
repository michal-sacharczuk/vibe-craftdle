/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        mc: {
          stone: "#7F7F7F",
          dirt: "#866043",
          grass: "#5D9B47",
          wood: "#BC9862",
          dark: "#1D1D1D",
          darker: "#141414",
          green: "#55FF55",
          red: "#FF5555",
          gold: "#FFAA00",
          gray: "#AAAAAA",
          lightgray: "#C6C6C6",
          obsidian: "#1B1021",
        },
      },
      fontFamily: {
        minecraft: ['"Press Start 2P"', "monospace"],
      },
    },
  },
  plugins: [],
};
