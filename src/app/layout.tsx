import './globals.css';
import { SavedURLsProvider } from '@/contexts/SavedURLsContext';
import Header from '@/components/Header';
import { palette } from '@/lib/palette';

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
      <body className="bg-pagebg text-pagetext">
        <SavedURLsProvider>
          <Header />
          {children}
        </SavedURLsProvider>
      </body>
    </html>
  );
}
