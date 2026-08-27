/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        /**
         * Farm Design System Color Tokens
         *
         * Naming: farm-<role>
         * Dark mode: use NativeWind's `dark:` variant against these tokens.
         *
         * Philosophy: the palette is desaturated earth tones (olive greens,
         * warm grays) that feel agricultural without looking like a toy app.
         * Accent is a vivid grass green used sparingly for CTAs only.
         */
        farm: {
          // Backgrounds
          bg: '#F6F5F0',          // warm off-white — base page bg
          surface: '#FFFFFF',     // card/panel surface
          'surface-2': '#EDECE8', // secondary surface (filters, sidebars)

          // Borders
          border: '#DDDBD3',      // default border
          'border-strong': '#B5B2A7', // emphasized border

          // Text
          text: '#1C1C1A',        // primary text
          muted: '#6B6B60',       // secondary / placeholder text
          inverse: '#FFFFFF',     // text on dark/primary bg

          // Brand
          primary: '#3D7A3A',     // main brand green (CTAs, active states)
          'primary-light': '#5EA35B', // hover / lighter variant
          'primary-bg': '#EBF5EA', // tinted bg (badge, icon containers)

          // Semantics
          danger: '#C0392B',       // destructive / error
          'danger-bg': '#FDF0EF',  // error badge bg
          warning: '#D97706',      // warning / withdrawal active
          'warning-bg': '#FFFBEB', // warning badge bg
          success: '#2E7D32',      // success / animal cleared
          'success-bg': '#F0FBF0', // success badge bg
        },
      },
      fontFamily: {
        sans: ['Inter', 'System', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
