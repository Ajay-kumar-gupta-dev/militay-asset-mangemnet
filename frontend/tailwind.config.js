/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Command-console palette: near-black with a green undertone
        // (not pure #000) so panels read as deliberately dark, not
        // "no theme set". Olive accent ties to the domain; amber flags
        // anything that reduces stock (assign/expend); rust flags
        // shortfalls.
        ink: {
          DEFAULT: '#0B0F0D',
          surface: '#121712',
          raised: '#182018',
          border: '#26302A',
        },
        olive: {
          DEFAULT: '#7A9556',
          bright: '#9AB878',
          dim: '#4E6339',
        },
        amber: {
          DEFAULT: '#C98A3E',
          bright: '#E0A85E',
        },
        rust: {
          DEFAULT: '#B4432F',
          bright: '#D15A42',
        },
        parchment: {
          DEFAULT: '#E8ECE4',
          muted: '#98A296',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
