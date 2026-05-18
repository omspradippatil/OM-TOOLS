import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // ffmpeg.wasm must be excluded from Vite's pre-bundling
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
        },
      },
    },
  },
  server: {
    // No COOP/COEP headers — they block Firebase Google Auth popups (window.closed).
    // Single-threaded ffmpeg.wasm (no SharedArrayBuffer) works fine without them.
  },
});
