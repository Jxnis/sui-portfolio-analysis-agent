import { Providers } from "@/providers/WalletProvider";
import "./globals.css";
import { Inter } from "next/font/google";
import type React from "react"; 
import "@mysten/dapp-kit/dist/index.css";


const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
