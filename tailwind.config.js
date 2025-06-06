/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',        // ✅ App Router pages/components
    './src/components/**/*.{js,ts,jsx,tsx}', // ✅ Reusable components
    './src/pages/**/*.{js,ts,jsx,tsx}',      // ✅ (Optional) Legacy Pages
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 300ms ease-out forwards',
      },
    },
  },
  plugins: [],
};