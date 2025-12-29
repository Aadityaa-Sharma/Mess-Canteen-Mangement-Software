import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Providers from "@/lib/providers";

export const metadata: Metadata = {
  title: 'Mess Management',
  description: 'Efficient Canteen Management System',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
