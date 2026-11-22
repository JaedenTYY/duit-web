import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5F0',
        surface: '#FFFFFF',
        sunken: '#EFECE5',
        line: {
          DEFAULT: '#E4E0D7',
          strong: '#D6D1C6',
        },
        ink: {
          DEFAULT: '#1C1B19',
          2: '#57534C',
          3: '#6E6A62',
        },
        pandan: {
          DEFAULT: '#0E5A52',
          deep: '#0A4540',
          tint: '#E2EEEA',
        },
        saffron: {
          DEFAULT: '#D9A23A',
          tint: '#FBF0D9',
        },
        positive: {
          DEFAULT: '#2E7048',
          tint: '#E4F1E8',
        },
        caution: {
          DEFAULT: '#8F5B00',
          tint: '#FAEFD6',
        },
        unusual: {
          DEFAULT: '#A3421A',
          tint: '#F9E6DC',
        },
        cat: {
          food: '#C9772E',
          shopping: '#A0566E',
          groceries: '#4C8466',
          transport: '#3F6C98',
          bills: '#4F4778',
          fun: '#6B5A1A',
          other: '#B5AFA4',
        },
        duit: {
          primary: '#0E5A52',
          dark: '#1C1B19',
          mid: '#57534C',
          light: '#E2EEEA',
          success: '#2E7048',
          warning: '#8F5B00',
          danger: '#B3261E',
          purple: '#7468A0',
        },
        slate: {
          50: '#F7F5F0', 100: '#EFECE5', 200: '#E4E0D7', 300: '#D6D1C6',
          400: '#6E6A62', 500: '#57534C', 600: '#48453F', 700: '#34322E',
          800: '#292824', 900: '#1C1B19', 950: '#1C1B19',
        },
        emerald: {
          50: '#E2EEEA', 100: '#D3E6DE', 200: '#B6D5C8', 300: '#8DBDAE',
          400: '#438B7D', 500: '#0E5A52', 600: '#0E5A52', 700: '#0A4540',
          800: '#083A35', 900: '#062F2B', 950: '#04231F',
        },
        blue: {
          50: '#E2EEEA', 100: '#D3E6DE', 200: '#B6D5C8', 300: '#8DBDAE',
          400: '#438B7D', 500: '#0E5A52', 600: '#0E5A52', 700: '#0A4540',
          800: '#083A35', 900: '#062F2B', 950: '#04231F',
        },
        amber: {
          50: '#FAEFD6', 100: '#F4DEAE', 200: '#E9C980', 300: '#D8AC55',
          400: '#B98527', 500: '#9F6908', 600: '#8F5B00', 700: '#6F4700',
          800: '#573800', 900: '#412A00', 950: '#302000',
        },
        rose: {
          50: '#FBE4E1', 100: '#F5CBC6', 200: '#E9A5A0', 300: '#D97B73',
          400: '#C44B42', 500: '#B3261E', 600: '#B3261E', 700: '#8D1D18',
          800: '#751814', 900: '#5F1412', 950: '#3F0F0E',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        '2xl': '40px',
      }
    },
  },
  plugins: [],
} satisfies Config
