import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#1a1a2e", 2: "#3d3d5c", 3: "#7a7a9a" },
        surface: "#f8f7fc",
        card: "#ffffff",
        accent: { DEFAULT: "#5b4cf5", 2: "#8b5cf6" },
        gold: "#f59e0b",
        green: "#10b981",
        red: "#ef4444",
        border: "rgba(91,76,245,0.12)",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        serif: ["DM Serif Display", "serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(91,76,245,0.08)",
        "card-lg": "0 8px 32px rgba(91,76,245,0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
