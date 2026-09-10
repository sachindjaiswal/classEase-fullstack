/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1E2A4A',
          hover: '#16213B',
          light: '#33456F',
        },
        gold: {
          DEFAULT: '#C89B3C',
          light: '#E4C989',
          dark: '#A87F2C',
        },
        base: '#F6F7FA',
        surface: '#FFFFFF',
        border: '#E4E7EC',
        ink2: '#1A1F2B',
        muted: '#646F82',
        success: '#2F9E5B',
        danger: '#D64545',
        warning: '#E0A339',
        teal: {
          DEFAULT: '#2E9B9A',
          dark: '#227675',
          light: '#5FC4C3',
        },
        yellow: '#FFD014',
        pink: '#FF3E6C',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
