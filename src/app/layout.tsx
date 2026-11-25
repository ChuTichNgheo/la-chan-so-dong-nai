import type { Metadata } from 'next';
import { Be_Vietnam_Pro, Lexend } from 'next/font/google';
import './globals.css';

const lexend = Lexend({
  variable: '--font-lexend',
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700', '800'],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Lá Chắn Số Đồng Nai — INFINITY AI',
  description:
    'Ứng dụng phòng chống lừa đảo trực tuyến, bảo vệ người cao tuổi và nâng cao kỹ năng số tại Đồng Nai.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${lexend.variable} ${beVietnamPro.variable}`}>
      <body className="min-h-dvh bg-[#F4FBF8] font-[family-name:var(--font-be-vietnam)] text-[#0F172A] antialiased">
        {children}
      </body>
    </html>
  );
}
