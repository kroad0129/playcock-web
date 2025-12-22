import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/club-players": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/sessions": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/waiting-teams": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/matches": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
