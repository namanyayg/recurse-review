import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}', // Assuming components are here
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',     // Assuming app directory structure
  ],
  theme: {
    extend: {
      // Add any theme extensions here if needed in the future
    },
  },
  plugins: [],
  // @ts-expect-error - safelist is a valid property but might not be recognized by the current types
  safelist: [
    {
      pattern: /.*/, // Safelists all classes - adjust if needed for bundle size
    },
  ],
};

export default config; 