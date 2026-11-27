/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // CaféTrace usa su propia CSS; desactivamos el reset global de Tailwind.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        forest: '#173D32',
        coffeeGreen: '#386B4D',
        espresso: '#4A3027',
        cream: '#F4EFE5',
        slateInk: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
