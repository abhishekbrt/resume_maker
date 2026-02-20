import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Resume Maker',
  description: 'Build a professional ATS-friendly resume PDF in minutes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
