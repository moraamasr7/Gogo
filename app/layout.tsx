import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "لوحة تحكم Gogo Concrete | الإدارة والطلبات",
  description: "لوحة تحكم صاحب المشروع لإدارة طلبات ومنتجات وعروض متجر Gogo Concrete",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="h-full font-sans bg-stone-50 text-stone-900 antialiased selection:bg-brass-500/20 selection:text-stone-900">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1D1C19',
              color: '#F9F9F8',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
