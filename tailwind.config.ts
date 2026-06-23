import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Project-specific semantic colors */
        "status-completed": "hsl(var(--status-completed))",
        "status-completed-foreground": "hsl(var(--status-completed-foreground))",
        "status-progress": "hsl(var(--status-progress))",
        "status-progress-foreground": "hsl(var(--status-progress-foreground))",
        "status-pending": "hsl(var(--status-pending))",
        "status-pending-foreground": "hsl(var(--status-pending-foreground))",
        "status-func-testing": "hsl(var(--status-func-testing))",
        "status-func-testing-foreground": "hsl(var(--status-func-testing-foreground))",
        "status-blocked": "hsl(var(--status-blocked))",
        "status-blocked-foreground": "hsl(var(--status-blocked-foreground))",
        "status-planner-review": "hsl(var(--status-planner-review))",
        "status-planner-review-foreground": "hsl(var(--status-planner-review-foreground))",
        "surface": "hsl(var(--surface))",
        "surface-hover": "hsl(var(--surface-hover))",
        "sidebar": "hsl(var(--sidebar))",
        "tab-active": "hsl(var(--tab-active))",
        "tab-active-foreground": "hsl(var(--tab-active-foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "elevated": "var(--shadow-elevated)",
        "subtle": "var(--shadow-subtle)",
        "modal": "var(--shadow-modal)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in": "slide-in 0.25s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config