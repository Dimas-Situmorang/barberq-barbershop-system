import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#191714",
        clay: "#a0522d",
        brass: "#c8902e",
        mint: "#2f8f7d",
        paper: "#faf7f0"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(25, 23, 20, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
