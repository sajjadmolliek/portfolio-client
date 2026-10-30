import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { bodyClass, description } from '@/lib/pages/home';
import SiteEffects from '@/components/SiteEffects';
import CursorFX from '@/components/CursorFX';
import GitHubActivity from '@/components/GitHubActivity';

export const metadata: Metadata = {
  title: {
    default: 'MD. Sajjad Hossain — Full-stack Developer',
    template: '%s — MD. Sajjad Hossain',
  },
  description,
  applicationName: 'MD. Sajjad Hossain',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-icon-180.png',
    other: [{ rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  openGraph: {
    title: 'MD. Sajjad Hossain — Full-stack Developer',
    description,
    images: ['/portfolio.png'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={bodyClass}>
        {/* The captured stylesheet is a static file (public/site.css) rather than an
            import — see scripts/generate-pages.mjs. */}
        <link rel="stylesheet" href="/site.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Pacifico&family=Passions+Conflict&family=Rubik+Glitch&display=swap"
        />
        {children}
        {/* the captured site's client-side behaviour: scroll reveals, the hexagon
            background, the custom cursor and the live GitHub calendar */}
        <SiteEffects />
        <CursorFX />
        <GitHubActivity />
      </body>
    </html>
  );
}
