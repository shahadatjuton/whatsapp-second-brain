import type { Config } from 'tailwindcss';

// Design tokens are defined here so every component shares one source of truth.
// Dark mode is class-based and toggled on the shadow-root host element.
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#25D366', // WhatsApp green
          fg: '#128C7E',
          dark: '#075E54',
        },
        surface: {
          light: '#ffffff',
          muted: '#f5f6f7',
          dark: '#111b21',
          'dark-muted': '#202c33',
        },
      },
      borderRadius: {
        card: '0.875rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
