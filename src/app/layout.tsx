import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mondibet",
  description: "Friendly FIFA World Cup betting manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

