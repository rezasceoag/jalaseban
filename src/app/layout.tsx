import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "جلسه‌بان | دستیار جلسات شرکت",
  description: "ثبت، پیاده‌سازی و استخراج تصمیم‌ها و تسک‌های جلسات شرکت",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
