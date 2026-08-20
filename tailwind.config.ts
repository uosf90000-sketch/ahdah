import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b1f33",
        palm: { 50: "#eef5ff", 100: "#d9e8ff", 500: "#2d7ff9", 600: "#146ef5", 700: "#0e56c9" },
        sand: { 50: "#fff8f3", 100: "#ffede3", 300: "#ffc6a8", 500: "#f36b3d" },
        coral: "#d92d20"
      },
      boxShadow: {
        card: "0 14px 40px rgba(11,31,51,.07)",
        float: "0 14px 28px rgba(20,110,245,.22)"
      },
      borderRadius: { "4xl": "2rem" }
    }
  },
  plugins: []
} satisfies Config;
