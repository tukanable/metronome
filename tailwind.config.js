module.exports = {
  darkMode: 'false',
  content: [
    "./index.html",
    "./src/**/*.(js|ts)",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: false,
    darkTheme: "light",
  },
}
