import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import ConfettiProvider from "@/components/ConfettiProvider";
import SwipeNavWrapper from "@/components/SwipeNavWrapper";

export const metadata: Metadata = {
  title: "HabitFlow — Build Better Habits",
  description: "Track your daily habits, build streaks, and visualize your progress with HabitFlow.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HabitFlow",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Load Inter font from Google Fonts — async so app doesn't block */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ConfettiProvider />
            <SwipeNavWrapper>
              {children}
            </SwipeNavWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
