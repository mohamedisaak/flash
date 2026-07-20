/**
 * Tailwind CSS v4 is configured as a PostCSS plugin. Unlike v3, there is no
 * tailwind.config.js by default — theme/config live in CSS (see app/globals.css).
 * See teaching/15-tailwind/01-what-is-tailwind.md.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
