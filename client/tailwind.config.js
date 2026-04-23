export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design System from HTML reference
        parchment: '#EDE8DF',
        forest: '#1A3320',
        terracotta: '#C4613A',
        soil: '#221E18',
        stone: '#7A6E63',
        moss: '#3D6B4F',
        cream: '#F5F0E8',
        'deep-forest': '#1C3520',
        sage: '#4A7C59',

        // Semantic aliases (mapped to reference)
        primary: '#1A3320',
        'primary-container': '#1C3520',
        secondary: '#3D6B4F',
        'tertiary-container': '#C4613A',

        surface: '#EDE8DF',
        'surface-low': '#F5F0E8',
        'surface-mid': '#F5F0E8',
        'surface-high': '#D8D1C5',
        'surface-white': '#FAFAF7',

        outline: '#E0D8CE',
        'outline-strong': '#D8D1C5',
        'on-surface': '#221E18',
        'on-surface-variant': '#7A6E63',
        'on-secondary': '#ffffff',

        sidebar: '#1A3320',
      },
      fontFamily: {
        sans: ['"Outfit"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Archivo Black"', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['10px', { lineHeight: '1.2', letterSpacing: '0.15em', fontWeight: '700' }],
        'label-md': ['11px', { lineHeight: '1.3', letterSpacing: '0.15em', fontWeight: '700' }],
        'body-sm': ['13px', { lineHeight: '1.6' }],
        'body': ['14px', { lineHeight: '1.6' }],
        'body-lg': ['15px', { lineHeight: '1.6' }],
        'headline-sm': ['20px', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['28px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['48px', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-md': ['64px', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-lg': ['100px', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '800' }],
        'display-xl': ['160px', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '800' }],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '10px',
        'xl': '16px',
        '2xl': '20px',
        'badge': '4px',
      },
      width: {
        sidebar: '220px',
      },
      minWidth: {
        sidebar: '220px',
      },
      margin: {
        sidebar: '220px',
      },
      boxShadow: {
        'ambient': '0 12px 40px rgba(34, 30, 24, 0.08)',
        'soft': '0 4px 16px rgba(34, 30, 24, 0.04)',
      },
    },
  },
  plugins: [],
}
