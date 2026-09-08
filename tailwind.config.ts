import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#FAF8F5',
          100: '#F4EFEA',
          200: '#E8DFD5',
          300: '#D6C7B6',
          400: '#BDAB94',
          500: '#A38F75',
        },
        stone: {
          50: '#F9F9F8',
          100: '#F2F2F0',
          200: '#E4E3DF',
          300: '#D1CFCA',
          400: '#A8A59E',
          500: '#7E7A71',
          700: '#3E3C38',
          800: '#2A2926',
          900: '#1D1C19',
          950: '#141311',
        },
        concrete: {
          50: '#F7F7F8',
          100: '#EFEFF1',
          200: '#DFE0E4',
          300: '#C2C4CC',
          400: '#9EA1AD',
          500: '#767986',
          800: '#26272E',
          900: '#1B1C20',
          950: '#121316',
        },
        brass: {
          300: '#ECC87A',
          400: '#DFB15B',
          500: '#C89736',
          600: '#A97C23',
        },
        charcoal: '#18181B',
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'Cairo', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
