import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "SIWA OASIS | The Premium Desert Marketplace",
  description: "Discover luxury accommodations, authentic tours, and world-class dining in the heart of Egypt's Western Desert.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans min-h-screen flex flex-col`}>
        {/* Ambient Background Glow */}
        <div className="fixed inset-0 z-[-1] bg-bg-base">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-500/10 blur-[120px] pointer-events-none" />
        </div>
        
        {children}
      </body>
    </html>
  );
}
