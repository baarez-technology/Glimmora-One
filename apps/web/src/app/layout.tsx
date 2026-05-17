import type { Metadata } from 'next';
import './globals.css';
import { SupportBot } from '@/components/support-bot';

export const metadata: Metadata = {
  title: 'Glimmora ONE — your wisdom companion',
  description:
    'A calm space for reflection, story, and inner work. Glimmora ONE is your AI companion, library of wisdom, and personal consciousness journal — together.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap"
        />
        <style>{`:root{--font-sans:'Inter',ui-sans-serif,system-ui;--font-serif:'Fraunces',ui-serif,Georgia,serif;}`}</style>
        <script
          // Avoid flash of wrong theme.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('glimmora-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <SupportBot />
      </body>
    </html>
  );
}
