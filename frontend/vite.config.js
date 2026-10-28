import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    sourcemap: false,
  },
  optimizeDeps: {
    include: [
      "@mui/material",
      "@emotion/react",
      "@emotion/styled",
      "axios",
      "react",
      "react-dom",
      "react-router-dom",
    ],
  },
});
