import type { Metadata } from 'next';
import type React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Milo — Tactile Kanban Boards',
  description: 'Fast, agent-verifiable Trello clone with Atlassian Design tokens.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
