import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        atlassian: {
          primary: '#0052CC',
          primaryHover: '#0065FF',
          neutralDark: '#172B4D',
          neutralMedium: '#6B778C',
          neutralLight: '#EBECF0',
          neutralSubtle: '#F4F5F7',
        },
      },
    },
  },
  plugins: [],
};

export default config;
