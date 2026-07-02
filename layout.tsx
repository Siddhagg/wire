import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BUSINESS_NAME, TOOL_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${TOOL_NAME} · ${BUSINESS_NAME}`,
  description:
    "Build a wire order across sizes and instantly compare the cost across every brand, with live discounts and GST.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1c2942",
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
