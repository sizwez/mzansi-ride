import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { SyncProvider } from "@/context/SyncContext";
import PWARegistry from "@/components/PWARegistry";
import ConnectivityStatus from "@/components/ConnectivityStatus";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";

export const metadata: Metadata = {
  title: "Mzansi Ride | Cooperative Mobility",
  description: "A driver & community-owned transport platform for South Africa. Fair fares, cooperative ownership, and unmatched safety.",
  keywords: "ride-hailing, South Africa, cooperative, transport, taxi, e-hailing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0A0E1A" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <GlobalErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <LanguageProvider>
                <SyncProvider>
                  <PWARegistry />
                  <ConnectivityStatus />
                  {children}
                </SyncProvider>
              </LanguageProvider>
            </NotificationProvider>
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
