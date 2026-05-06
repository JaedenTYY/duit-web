import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        duit: {
          primary: "#1A56DB",
          dark: "#1E293B",
          mid: "#475569",
          light: "#EFF6FF",
          success: "#059669",
          warning: "#D97706",
          danger: "#DC2626",
          purple: "#7C3AED",
        },
        // Cyber-Fintech Palette
        slate: {
          950: "#0f172a", // Forced background color
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      backdropBlur: {
        '2xl': '40px',
      }
    },
  },
  plugins: [],
} satisfies Config
