import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Decision Flow",
  description: "Visual AI decision workflows powered by React Flow + Inngest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
