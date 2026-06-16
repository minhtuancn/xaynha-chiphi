import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { OfflineProvider } from "@/components/offline-provider";
import { OfflineBanner } from "@/components/offline-banner";

export const metadata: Metadata = {
  title: "Xây Nhà Chi Phí",
  description: "Quản lý chi phí xây dựng",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <OfflineProvider>
              <OfflineBanner />
              {children}
              <Toaster />
            </OfflineProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
