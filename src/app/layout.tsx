import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthSyncProvider } from "@/components/auth-sync-provider";
import { PwaProvider } from "@/components/pwa-provider";
import { SplashScreen } from "@/components/splash-screen";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "WCM Ministry Coordinator Reporting System",
  description: "Centralized reporting portal for WCM Ministry",
  applicationName: "WCM Outreach",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WCM Outreach",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthSyncProvider>
            <PwaProvider>
              <SplashScreen />
              {children}
            </PwaProvider>
            <Toaster 
              position="top-right" 
              richColors 
              toastOptions={{
                style: {
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: '600',
                },
              }}
            />
          </AuthSyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
