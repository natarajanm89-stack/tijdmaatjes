import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tijdmaatjes · Leer klokkijken in het Nederlands",
  description: "Een speelse klokleer-app voor kinderen van 6 tot 8 jaar, met luisteren, oefenen en uitspraak.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
