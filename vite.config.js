import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Akamata',
        short_name: 'Akamata',
        description: 'Free bite-sized guides for the things you learn in a new role.',
        theme_color: '#0d5c4b',
        background_color: '#eef3f0',
        display: 'standalone',
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      },
      workbox: {
        // Modules you have opened stay readable offline.
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.includes('/rest/v1/modules'),
          handler: 'NetworkFirst',
          options: { cacheName: 'akamata-modules', expiration: { maxEntries: 60 } }
        }]
      }
    })
  ]
})
