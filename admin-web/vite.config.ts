import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwind from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      // Configuration pour la build de production
    },
  },
  define: {
    // Définir une variable d'environnement pour l'URL de l'API en fonction de l'environnement
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8000'),
  },
})
