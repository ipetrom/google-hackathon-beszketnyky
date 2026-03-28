import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import ResponsiveShell from "@/components/layout/ResponsiveShell";

export const metadata: Metadata = {
  title: "SelfLet",
  description: "AI-Powered Rental Property Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ResponsiveShell>{children}</ResponsiveShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
