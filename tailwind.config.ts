import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff4f1",
          100: "#ffe5de",
          200: "#ffc9bb",
          300: "#ffa38d",
          400: "#fb7456",
          500: "#f1532f",
          600: "#dd3c1a",
          700: "#b82f13",
          800: "#962a15",
          900: "#7b2817",
        },
        ink: {
          DEFAULT: "#16181d",
          soft: "#3f4450",
          muted: "#6b7180",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)",
        lift: "0 8px 30px rgba(16,24,40,.12)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
} satisfies Config;
