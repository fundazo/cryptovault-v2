/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8faff',
          100: '#f0f4ff',
          200: '#e2e8f0',
          300: '#94a3b8',
          400: '#475569',
          500: '#1e293b',
          600: '#111827',
          700: '#0d1117',
          800: '#080b14',
          900: '#030508',
        },
        accent: { DEFAULT: '#3b82f6', dark: '#2563eb', light: '#60a5fa' },
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        purple: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2563eb, #7c3aed)',
        'gradient-green': 'linear-gradient(135deg, #10b981, #3b82f6)',
        'gradient-gold': 'linear-gradient(135deg, #f59e0b, #ef4444)',
        'gradient-card': 'linear-gradient(145deg, #111827, #0d1117)',
      },
      boxShadow: {
        'glow-blue': '0 0 40px rgba(59,130,246,0.2)',
        'glow-green': '0 0 40px rgba(16,185,129,0.2)',
        'card': '0 4px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 48px rgba(0,0,0,0.5)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 4s linear infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
      },
      borderRadius: { '2xl': '16px', '3xl': '24px', '4xl': '32px' },
    },
  },
  plugins: [],
};
