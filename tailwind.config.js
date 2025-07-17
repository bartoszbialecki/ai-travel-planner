import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,astro}", "./public/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssAnimate],
};

export default config;
