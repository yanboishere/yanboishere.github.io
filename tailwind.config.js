/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      colors: {
        warm: {
          50: "#fdf8f0",
          100: "#f9eedd",
          200: "#f2dbb8",
          300: "#e8c48a",
          400: "#dda75c",
          500: "#d18f3a",
          600: "#b87530",
          700: "#995b2a",
          800: "#7d4a28",
          900: "#663e24",
        },
        forest: {
          50: "#f0f7f2",
          100: "#dbede0",
          200: "#b9dcc5",
          300: "#8ac39e",
          400: "#5ca678",
          500: "#3d8b5d",
          600: "#2d7049",
          700: "#255a3c",
          800: "#204832",
          900: "#1b3b2a",
        },
        sunset: {
          50: "#fef5ee",
          100: "#fde8d7",
          200: "#faceae",
          300: "#f6ab7b",
          400: "#f08046",
          500: "#ec6322",
          600: "#dd4a18",
          700: "#b73716",
          800: "#922e19",
          900: "#762818",
        },
        cream: "#faf6ef",
        coffee: "#6f4e37",
        paper: "#f5f0e8",
      },
      fontFamily: {
        display: ['"Playfair Display"', '"LXGW WenKai"', "Georgia", "serif"],
        hand: ['"LXGW WenKai"', "cursive"],
        body: ['"LXGW WenKai"', "system-ui", "sans-serif"],
        mono: ['"LXGW WenKai Mono"', "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        grain: "grain 8s steps(10) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        grain: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-5%, -10%)" },
          "20%": { transform: "translate(-15%, 5%)" },
          "30%": { transform: "translate(7%, -25%)" },
          "40%": { transform: "translate(-5%, 25%)" },
          "50%": { transform: "translate(-15%, 10%)" },
          "60%": { transform: "translate(15%, 0%)" },
          "70%": { transform: "translate(0%, 15%)" },
          "80%": { transform: "translate(3%, 35%)" },
          "90%": { transform: "translate(-10%, 10%)" },
        },
      },
    },
  },
  plugins: [],
};
