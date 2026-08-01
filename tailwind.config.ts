import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: 'rgb(var(--navy) / <alpha-value>)',
        teal: 'rgb(var(--teal) / <alpha-value>)',
        mint: 'rgb(var(--mint) / <alpha-value>)',
        light: 'rgb(var(--light) / <alpha-value>)',
        muted: 'rgb(var(--text-muted) / <alpha-value>)',
        white: 'rgb(var(--white) / <alpha-value>)',
        edge: 'rgb(var(--edge-light) / <alpha-value>)',
        'edge-dark': 'rgb(var(--edge-dark) / <alpha-value>)',
        'body-dark': 'rgb(var(--body-on-dark) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        lift: '0 18px 40px -16px rgb(10 10 12 / 0.35)',
        'lift-dark': '0 18px 40px -16px rgb(0 0 0 / 0.6)',
        offset: '6px 6px 0 0 rgb(245 245 246 / 1)',
        'offset-navy': '6px 6px 0 0 rgb(10 10 12 / 1)',
      },
    },
  },
  plugins: [],
};

export default config;
