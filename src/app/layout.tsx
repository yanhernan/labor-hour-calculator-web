import type { Metadata } from "next";
import { Geist, Geist_Mono, Mandali } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "../providers/session-provider";
import QueryProvider from "../providers/query-provider";
import Navbar from "../components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const mandaliSans = Mandali({
  variable: "--font-mandali",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Labor Hour Calculator",
  description: "Calculate and track labor hours efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mandaliSans.variable} antialiased`}
      >
        <QueryProvider>
          <NextAuthSessionProvider>
            <Navbar />
            {children}
          </NextAuthSessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
