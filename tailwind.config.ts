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
        // MMG brand: Near-Black ink for primary actions/text
        ink: { DEFAULT: "#1D1D1B", 2: "#4A4A47", 3: "#8A8A85" },
        // MMG light background
        surface: "#FDF5F6",
        card: "#ffffff",
        // MMG Master Pink accent; lavender = support only, never dominant
        accent: { DEFAULT: "#FF97A9", 2: "#8A5FBE" },
        gold: "#f59e0b",
        green: "#10b981",
        red: "#ef4444",
        border: "rgba(29,29,27,0.12)",
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
        serif: ["Source Serif Pro", "Georgia", "serif"],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(29,29,27,0.06)",
        "card-lg": "0 8px 32px rgba(29,29,27,0.10)",
      },
      backgroundImage: {
        // MMG master gradient — use at most ONE per composition
        mmgGradient: "linear-gradient(45deg, #FF8BAE 20%, #FF8F8B 80%)",
      },
    },
  },
  plugins: [],
};
export default config;
