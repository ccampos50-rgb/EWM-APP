/** Shared Tailwind preset for EWM Altus apps. */
module.exports = {
  theme: {
    extend: {
      colors: {
        altus: {
          DEFAULT: "#0E3D52",
          primary: "#0E3D52",
          "primary-mid": "#1A5570",
          accent: "#5EB4CC",
          "accent-bright": "#7FC4DA",
          cream: "#F5F0E6",
          muted: "#7A9AAB",
          success: "#16A34A",
          warning: "#D97706",
          error: "#DC2626",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
      },
    },
  },
};
