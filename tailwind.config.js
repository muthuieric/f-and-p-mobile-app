/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#067661",
          dark: "#165e51",
        },
        secondary: "#00B050",
        grocery: {
          green: "#067661",
          lightGreen: "#00B050",
          gray: "#9CA3AF",
          lightGray: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};
