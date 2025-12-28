import type { Metadata } from "next";
import { ThemeProvider } from "next-themes"
import "./globals.css";
import CircularCursor from "@/components/LazyCursor/lazycursot";

export const metadata: Metadata = {
  title: "Syed Saadat Ahmad",
  description: "Syed Saadat Ahmad is a Software developer based out of Aligarh, India. He has been a part of the SS AMU SAT satellite project where he has been working as a satellite payload designer. He has built geodata based image capturing programs and has worked on the hardware side of things",
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

