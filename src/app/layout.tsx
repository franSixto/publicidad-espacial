import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: { default: "AdSpace — Publicidad en espacios reales", template: "%s · AdSpace" },
  description:
    "Marketplace de publicidad física en Argentina. Alquilá frentes, vehículos, vidrieras y terrenos para tu marca, o ganá dinero con tus espacios.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = { themeColor: "#f1532f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
