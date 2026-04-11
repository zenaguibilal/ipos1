import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: {
        container: {
            center: true,
            padding: '1rem',
            screens: { '2xl': '1400px' },
        },
        extend: {
            colors: {
                border:     'hsl(var(--border))',
                input:      'hsl(var(--input))',
                ring:       'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT:    'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT:    'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT:    'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT:    'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT:    'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT:    'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT:    'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                chart: {
                    primary:    'hsl(var(--chart-primary))',
                    secondary:  'hsl(var(--chart-secondary))',
                    tertiary:   'hsl(var(--chart-tertiary))',
                    quaternary: 'hsl(var(--chart-quaternary))',
                    quinary:    'hsl(var(--chart-quinary))',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            fontSize: {
                '2xs': ['0.65rem', { lineHeight: '1rem' }],
            },
            keyframes: {
                flash: {
                    '0%,100%': { background: 'transparent' },
                    '40%':     { background: 'hsl(var(--primary) / 0.12)' },
                },
            },
            animation: {
                flash: 'flash 0.35s ease-out',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
};

export default config;