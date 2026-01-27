// app/layout.tsx (server component)
import Providers from '@/components/Providers';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import './globals.css';
import { Metadata } from 'next';
import { CookieConsentProvider } from '@/contexts/CookieConsentContext';
import ClientCookieComponents from '@/app/ClientCookieComponents';

// Define default metadata
const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://openlabelsinitiative.org';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Open Labels Initiative',
  description: 'A standardized framework and data model for EVM/non-EVM address labeling',
  openGraph: {
    title: 'Open Labels Initiative',
    description: 'A standardized framework and data model for EVM/non-EVM address labeling',
    url: siteUrl,
    siteName: 'Open Labels Initiative',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Open Labels Initiative',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Labels Initiative',
    description: 'A standardized framework and data model for EVM/non-EVM address labeling',
    creator: '@open_labels',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webSiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteUrl,
    name: 'Open Labels Initiative',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?query={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: siteUrl,
    name: 'Open Labels Initiative',
    sameAs: [
      'https://x.com/open_labels',
      'https://github.com/openlabelsinitiative'
    ],
    logo: `${siteUrl}/og-image.png`
  };

  return (
    <html lang="en">
      <body>
        {/* Wrap the entire app with CookieConsentProvider */}
        <CookieConsentProvider>
          <Providers>
            <Navigation />
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
              {children}
            </div>
            <Footer />
            
            {/* Import cookie consent components */}
            <ClientCookieComponents />

            {/* Site-level structured data for search and organization */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify([webSiteLd, organizationLd]) }}
            />
          </Providers>
        </CookieConsentProvider>
      </body>
    </html>
  );
}
