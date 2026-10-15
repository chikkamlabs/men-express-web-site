import type {Metadata} from 'next';
import './globals.css'; // Global styles
import FloatingCartBar from '@/components/floatingCartBar';

export const metadata: Metadata = {
  title: 'Men Express',
  description: 'Men Express Web Site',
  openGraph: {
    title: 'Men Express',
    description: 'Men Express Web Site',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Men Express',
    description: 'Men Express Web Site',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
        <FloatingCartBar />
      </body>
    </html>
  );
}

