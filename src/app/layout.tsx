import './globals.css';
import { SavedURLsProvider } from '@/contexts/SavedURLsContext';
import Header from '@/components/Header';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inconsolata&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SavedURLsProvider>
          <Header />
          {children}
        </SavedURLsProvider>
      </body>
    </html>
  );
}
