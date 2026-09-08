import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#F9F9F8',
          100: '#F2F2F0',
          200: '#E4E3DF',
          300: '#D1CFCA',
          400: '#A8A59E',
          500: '#7E7A71',
          800: '#2A2926',
          900: '#1D1C19',
        },
        concrete: {
          50: '#F7F7F8',
          100: '#EFEFF1',
          200: '#DFE0E4',
          300: '#C2C4CC',
          400: '#9EA1AD',
          500: '#767986',
          900: '#1B1C20',
        },
        brass: {
          500: '#C89736',
          600: '#A97C23',
        },
        charcoal: '#18181B',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
