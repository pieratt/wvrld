import './globals.css';
import { SavedURLsProvider } from '@/contexts/SavedURLsContext';
import Header from '@/components/Header';
import { palette } from '@/lib/palette';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default palette for layout (system user)
  const defaultUser = {
    id: 1,
    username: 'system',
    title: 'System',
    color1: '#eeeeee',
    color2: '#111111',
    type: 'system'
  };
  
  const colors = palette({
    cardOwner: defaultUser,
    isFront: true,
    pageOwner: undefined
  });

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inconsolata&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          '--c1': colors.pageFont,
          '--c2': colors.pageBg,
        } as React.CSSProperties}
        className="bg-pagebg text-pagetext"
      >
        <SavedURLsProvider>
          <Header />
          {children}
        </SavedURLsProvider>
      </body>
    </html>
  );
}
