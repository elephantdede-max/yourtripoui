import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // ── Service Worker / PWA avec Workbox (Modif #18) ──
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectManifest: {
        // Limite la taille des assets pré-cachés (évite de cacher des fichiers > 5 Mo)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: false, // on garde manifest.json existant
      devOptions: {
        enabled: false, // SW désactivé en dev (sinon hot reload pète)
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    host: true, // expose sur le réseau local pour test iPhone
  },
  build: {
    // Code splitting + cache busting + minification dans UN SEUL rollupOptions
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'maps': ['leaflet', 'react-leaflet'],
          'icons': ['lucide-react'],
          'pdf': ['jspdf'],
          'image-crop': ['react-easy-crop'],
        },
        // Hash dans les noms de fichiers pour cache busting auto
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Minification agressive
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    chunkSizeWarningLimit: 600,
    sourcemap: false,
    target: 'es2020',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
      'lucide-react',
    ],
  },
});