import './globals.css';
import { SavedURLsProvider } from '@/contexts/SavedURLsContext';
import { VisitedURLsProvider } from '@/contexts/VisitedURLsContext';
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SavedURLsProvider>
          <VisitedURLsProvider>
            {children}
          </VisitedURLsProvider>
        </SavedURLsProvider>
      </body>
    </html>
  );
}
