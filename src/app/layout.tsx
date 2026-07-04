import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '哄哄模拟器',
  description: '在各种吵架场景中练习哄好你的恋爱对象，降低对方的愤怒值！',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
