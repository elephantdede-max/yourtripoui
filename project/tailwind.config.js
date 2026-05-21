/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAFA',
        surface: '#FFFFFF',
        ink: '#111111',
        muted: '#777777',
        subtle: '#E5E5E5',
        ok: '#16A34A',
        'ok-soft': '#F0FDF4',
        warn: '#CA8A04',
        'warn-soft': '#FEFCE8',
        err: '#DC2626',
        'err-soft': '#FEF2F2',
        info: '#2563EB',
        'info-soft': '#EFF6FF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #FF5733 0%, #FF3A7D 25%, #D833FF 50%, #6B5DFF 75%, #4B9EFF 100%)',
        'gradient-primary': 'linear-gradient(135deg, #FF5733 0%, #FF3A7D 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #D833FF 0%, #6B5DFF 100%)',
        'gradient-tertiary': 'linear-gradient(135deg, #4B9EFF 0%, #6B5DFF 100%)',
      },
      animation: {
        fadein: 'fadein 0.3s ease-out forwards',
        slideup: 'slideup 0.3s ease-out forwards',
      },
      keyframes: {
        fadein: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideup: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
