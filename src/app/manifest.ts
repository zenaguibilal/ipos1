
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'iPOS Zen - Point de Vente',
    short_name: 'iPOS Zen',
    description: 'Système de vente intelligent local-first',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0806',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
