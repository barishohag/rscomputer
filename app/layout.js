import './globals.css';

export const metadata = {
  title: 'RS Computer POS',
  description: 'Private point of sale workspace for RS Computer',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
