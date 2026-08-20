import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#132821",
        palm: { 50: "#eef8f3", 100: "#d8eee3", 500: "#16805d", 600: "#116b4d", 700: "#0d543d" },
        sand: { 50: "#fbf8f1", 100: "#f3ecdd", 300: "#ddcba9", 500: "#b7935c" },
        coral: "#e46f4c"
      },
      boxShadow: {
        card: "0 18px 50px rgba(19,40,33,.08)",
        float: "0 16px 32px rgba(22,128,93,.24)"
      },
      borderRadius: { "4xl": "2rem" }
    }
  },
  plugins: []
} satisfies Config;
