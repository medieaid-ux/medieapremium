import { Plus_Jakarta_Sans, Instrument_Serif } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
});

export const metadata = {
  title: 'Mediea Premium — Akses Layanan Digital Premium',
  description:
    'Dapatkan akses ke berbagai platform premium untuk kebutuhan hiburan dan produktivitas Anda. Pengiriman instan melalui sistem otomatis.',
  keywords: 'akun premium, chatgpt pro, netflix, canva, zoom, langganan digital, mediea premium',
  openGraph: {
    title: 'Mediea Premium — Akses Layanan Digital Premium',
    description: 'Platform terpercaya untuk akun langganan digital premium. Pengiriman otomatis & instan.',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${instrumentSerif.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
