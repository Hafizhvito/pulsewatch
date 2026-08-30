import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "PulseWatch · Uptime monitoring",
    template: "%s · PulseWatch",
  },
  description:
    "Self-hosted website and API monitoring with uptime statistics, response times, and incident history.",
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
