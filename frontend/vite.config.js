import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/api": {
        target: "https://onecart-backend-ag6p.onrender.com",
        changeOrigin: true,
        secure: false
      }
    }
  },

  build: {
    outDir: "dist"
  }
});
