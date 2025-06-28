import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@components/layout/navbar";
import { ConditionalLayout } from "@components/layout/conditional-layout";
import { ToastProviderWrapper } from "@components/ui/toast-provider-wrapper";
import { ThemeProvider } from "@/components/ui/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "K-Fin - Financial Analysis Platform",
  description: "Multi-tenant financial analysis and reporting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground h-full transition-colors`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
      >
        <ToastProviderWrapper>
          <Navbar />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </ToastProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
