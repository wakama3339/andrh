import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AndrH - Сохранение Данных и Файлов',
  description: 'Сервис хранения данных и файлов на Vercel Blob',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen antialiased bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
