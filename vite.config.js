import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    host: true,
    proxy: {
      "/api/support-demo": {
        target: "http://127.0.0.1:8788",
        changeOrigin: true
      },
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Tesseract looks up this basename inside its language directory.
        assetFileNames: (asset) =>
          asset.name === "eng.traineddata.gz" ? "assets/ocr-[hash]/[name][extname]" : "assets/[name]-[hash][extname]"
      }
    },
    sourcemap: false
  }
});
