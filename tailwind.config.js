/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        /** Inter (see `app/_layout.tsx` + `babel-plugin-inject-app-font-class.cjs`) */
        sans: ['Inter_400Regular'],
      },
      colors: {
        /** OtterRide brand yellow */
        primary: '#FFD000',
        secondary: '#E8E8E8',
        ink: '#1A1A1A',
        surface: '#F5F5F5',
        'surface-muted': '#EDEDED',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
