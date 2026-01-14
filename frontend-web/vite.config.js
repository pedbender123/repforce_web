import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import envCompatible from 'vite-plugin-env-compatible';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    envCompatible(),
    tsconfigPaths(),
  ],
  server: {
    port: 3000,
    open: true,
    host: true,
    proxy: {
      '/v1': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
         target: 'http://backend:8000',
         changeOrigin: true,
         secure: false,
      },
      '/manager': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      },
       '/admin': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    outDir: 'build',
  },
});
