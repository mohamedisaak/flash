/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: "#4f63d2",
        "brand-dark": "#3f51b5",
        accent: "#1dc175",
        muted: "#64748b",
        border: "#e2e8f0",
      },
    },
  },
  plugins: [],
};
