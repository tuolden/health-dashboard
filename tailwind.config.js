/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Design System Color Palette - Issue #2
      colors: {
        // Global App Colors
        'app-background': '#F4F6FA',
        'font-primary': '#101316',

        // Widget Background Variants
        'widget-default': '#FFFFFF',
        'widget-purple': '#DBD4FD',
        'widget-green': '#E4F0E6',
        'widget-pink': '#FED5D6',
        'widget-yellow': '#F1F7DB',
        'widget-grey': '#E0E1E5',
        'widget-light-purple': '#F2E3FE',
        'widget-dark-blue': '#E3ECF9',

        // Legacy colors for backward compatibility (will be phased out)
        background: '#F4F6FA', // Updated to match app-background
        cardBg: '#FFFFFF',
        primary: '#79BBFF',
        warning: '#FFD94D',
        danger: '#FF6B6B',
        success: '#B8F2E6',
        lavender: '#E0BBE4',
        orange: '#FFAD60',
        darkText: '#101316', // Updated to match font-primary
        lightGray: '#F1F4F9',
        mutedText: '#6B7280'
      },
      // Typography System - Issue #2
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      // Typography Tokens
      fontSize: {
        // Extend default sizes with semantic tokens
        'title': ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],      // 2xl, Bold
        'title-lg': ['3rem', { lineHeight: '3.5rem', fontWeight: '700' }],   // 3xl, Bold
        'subtitle': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }], // xl, SemiBold
        'widget-title': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '500' }], // lg, Medium
        'label': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '500' }], // sm, Medium
        'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],       // base, Regular
        'metric': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],  // 3xl, Bold
        'metric-lg': ['3rem', { lineHeight: '3.5rem', fontWeight: '700' }],  // 4xl, Bold
      },
      // Border radius for widgets
      borderRadius: {
        widget: '1.5rem',
      },
      // Grid system optimized for vertical layouts
      gridTemplateColumns: {
        'vertical-1': 'repeat(1, minmax(0, 1fr))',
        'vertical-2': 'repeat(2, minmax(0, 1fr))',
        'vertical-3': 'repeat(3, minmax(0, 1fr))',
        'vertical-4': 'repeat(4, minmax(0, 1fr))',
      },
      // Spacing optimized for vertical screens
      spacing: {
        'widget-gap': '1rem',
        'section-gap': '2rem',
        'nav-height': '4rem',
      },
      // Animation for widget refreshes
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'pulse-soft': 'pulseSoft 0.6s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // Shadows for depth in vertical layout
      boxShadow: {
        'widget': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'widget-hover': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'nav': '0 2px 4px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
