import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/theme/ThemeContext";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

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
    <html lang="ar" dir="rtl" className={`h-full ${cairo.variable}`}>
      <body className="h-full font-sans bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased selection:bg-brass-500/20 selection:text-stone-900 dark:selection:text-white transition-colors duration-200">
        <ThemeProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#1D1C19',
                color: '#F9F9F8',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-cairo), Cairo, sans-serif',
              },
            }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
