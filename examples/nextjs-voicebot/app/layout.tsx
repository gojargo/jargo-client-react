import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "jargo voicebot",
  description: "Next.js voicebot using @gojargo/jargo-client-react",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
