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
          50: '#F3F5FA',
          100: '#E6EAF3',
        },
        gold: {
          DEFAULT: '#C89B3C',
          light: '#E4C989',
          dark: '#A87F2C',
          50: '#FBF6EA',
        },
        base: '#F4F5FA',
        surface: '#FFFFFF',
        border: '#E6E8EF',
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
      borderRadius: {
        xl2: '1.15rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 2px 6px -2px rgba(16,24,40,0.06)',
        'card-hover': '0 14px 30px -12px rgba(30,42,74,0.22)',
        pop: '0 18px 44px -14px rgba(30,42,74,0.28)',
        soft: '0 4px 16px -6px rgba(30,42,74,0.10)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.65)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};
