import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/data/DataProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BarberQ",
  description: "Sistem manajemen dan reservasi barbershop"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} app-surface min-h-screen`}>
        <DataProvider>{children}</DataProvider>
      </body>
    </html>
  );
}
