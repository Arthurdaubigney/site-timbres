/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}", "./scripts/build.js"],
  theme: {
    extend: {
      colors: {
        nuit: {
          950: "#060D1D",
          900: "#0A1630",
          800: "#102043",
          700: "#1A2E5C",
          600: "#2B4175",
        },
        ivoire: {
          50: "#FBF8F1",
          100: "#F5EFE3",
          200: "#EBE2D0",
          300: "#D9CCB1",
        },
        or: {
          200: "#EBD7A4",
          300: "#DEC27D",
          400: "#CDAA5E",
          500: "#B8924A",
          700: "#7A5C20",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "ui-serif", "serif"],
        sans: ['"Geist"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 24px 60px -28px rgba(6, 13, 29, 0.45)",
        gold: "0 14px 34px -14px rgba(184, 146, 74, 0.55)",
      },
    },
  },
  plugins: [],
};
