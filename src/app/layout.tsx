import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SidebarLayout from "@/components/sidebar/SidebarLayout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bullfit Retail CRM",
  description: "Customer relationship management for Bullfit retail operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-900 text-slate-200`}>
        <SidebarLayout>{children}</SidebarLayout>
      </body>
    </html>
  );
}
