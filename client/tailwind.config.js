/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#070c18',
        surface:  '#0d1526',
        surface2: '#131f35',
        border:   '#1e2d47',
        teal:     '#14b8a6',
        'teal-dim': '#0d8f80',
        sky:      '#0ea5e9',
        muted:    '#64748b',
        warn:     '#f59e0b',
        danger:   '#ef4444',
        success:  '#10b981',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['Cascadia Code', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
