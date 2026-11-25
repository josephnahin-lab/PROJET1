import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Librescence — Apprendre à votre rythme",
    template: "%s | Librescence",
  },
  description:
    "Librescence, un espace d’apprentissage ouvert pour découvrir de nouveaux domaines et progresser à son rythme.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
