/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inconsolata', 'monospace'],
      },
      fontSize: {
        base: '14px',
      },
      colors: {
        pagebg: 'var(--c2)',
        pagetext: 'var(--c1)',
        cardbg: 'var(--c1)',
        cardtext: 'var(--c2)',
        pillbg: 'var(--c2)',
        pilltext: 'var(--c1)',
      },
    },
  },
  plugins: [],
} 