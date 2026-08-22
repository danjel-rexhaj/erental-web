import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Switched from the default generateSW to injectManifest so src/sw.js can hand-write
      // push/notificationclick listeners for real Web Push — generateSW's auto-built worker has
      // no hook point for those.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectManifest: {
        // App calls its own API on a different origin (erental-api.onrender.com) -- never precache
        // those, only the static build assets themselves.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest}'],
      },
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'ERental',
        short_name: 'ERental',
        description: 'Marketplace i qerasë së makinave në Shqipëri',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
