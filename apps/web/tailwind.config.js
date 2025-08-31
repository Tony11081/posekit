/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        pose: {
          wedding: '#fdf2f8',
          family: '#fefce8',
          newborn: '#f0f9ff',
          maternity: '#f0fdf4',
          couple: '#faf5ff',
          portrait: '#fef7ff',
          friends: '#fff7ed',
          business: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      aspectRatio: {
        'pose': '4 / 5',
        'og': '1200 / 630',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-out': 'fadeOut 0.2s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'scale-out': 'scaleOut 0.15s ease-in',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.8)', opacity: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      columns: {
        'auto-sm': 'repeat(auto-fill, minmax(280px, 1fr))',
        'auto-md': 'repeat(auto-fill, minmax(320px, 1fr))',
        'auto-lg': 'repeat(auto-fill, minmax(360px, 1fr))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    
    // Custom masonry plugin
    function({ addUtilities, theme }) {
      const breakpoints = theme('screens');
      
      addUtilities({
        '.masonry': {
          'column-count': '4',
          'column-gap': '1.5rem',
          'column-fill': 'balance',
        },
        
        [`@media (max-width: ${breakpoints.xl})`]: {
          '.masonry': {
            'column-count': '3',
          }
        },
        
        [`@media (max-width: ${breakpoints.md})`]: {
          '.masonry': {
            'column-count': '2',
          }
        },
        
        [`@media (max-width: ${breakpoints.sm})`]: {
          '.masonry': {
            'column-count': '1',
          }
        },
        
        '.masonry-item': {
          'break-inside': 'avoid',
          'margin-bottom': '1.5rem',
        }
      });
    },
    
    // Custom scrollbar plugin
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          'scrollbar-color': '#cbd5e1 #f1f5f9',
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          'width': '6px',
          'height': '6px',
        },
        '.scrollbar-thin::-webkit-scrollbar-track': {
          'background': '#f1f5f9',
          'border-radius': '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb': {
          'background': '#cbd5e1',
          'border-radius': '3px',
        },
        '.scrollbar-thin::-webkit-scrollbar-thumb:hover': {
          'background': '#94a3b8',
        },
      });
    }
  ],
}