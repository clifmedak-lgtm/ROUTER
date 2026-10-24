
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Router — Rides across Cameroon",
  description:
    "Book affordable moto and car rides across Cameroon with Router.",
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
