import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ViralizaTuRed - Impulsa tu Presencia en Redes Sociales",
  description: "La plataforma más poderosa para gestionar y hacer crecer tus redes sociales. Aumenta tu alcance, engagement y ventas de manera automática.",
  keywords: ["redes sociales", "marketing", "SMM", "social media", "viralizar", "crecimiento"],
  authors: [{ name: "ViralizaTuRed" }],
  openGraph: {
    title: "ViralizaTuRed - Impulsa tu Presencia en Redes Sociales",
    description: "La plataforma más poderosa para gestionar y hacer crecer tus redes sociales",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
