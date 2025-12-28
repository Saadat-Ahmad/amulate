import type { Metadata } from "next";
import { ThemeProvider } from "next-themes"
import "./globals.css";
import CircularCursor from "@/components/LazyCursor/lazycursot";

export const metadata: Metadata = {
  title: "autoTrader",
  description: "autoTrader provides solutions for moderm supply chain and procurement problems",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CircularCursor/>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

