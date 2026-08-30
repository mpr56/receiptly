import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receiptly: Your Digital Receipt Vault",
  description: "Track, organise, and search your receipts digitally",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JetBrains Mono carries the whole interface, it has true tabular
            figures, so every amount column lines up without tracking hacks.
            Inter is kept only for the few non-printed labels. */}
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
