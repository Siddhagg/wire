import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        // Agarwal Enterprises palette: navy + amber
        navy: {
          50: "#eef2f8",
          100: "#d5dfee",
          200: "#adbfdd",
          300: "#7f97c6",
          400: "#5471ac",
          500: "#3a5591",
          600: "#2d4372",
          700: "#26375d",
          800: "#1c2942",
          900: "#131d31",
          950: "#0b1220",
        },
        amber: {
          50: "#fff8eb",
          100: "#ffecc6",
          200: "#ffd688",
          300: "#ffbb4a",
          400: "#ffa01f",
          500: "#f97e07",
          600: "#dd5c02",
          700: "#b73f06",
          800: "#94310c",
          900: "#7a2a0d",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
