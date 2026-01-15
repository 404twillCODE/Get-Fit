import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import AuthGate from "@/components/AuthGate";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const withBasePath = (path: string) => `${basePath}${path}`;

export const metadata: Metadata = {
  title: "Get Fit - Your Journey to Wellness",
  description: "Transform your life with Get Fit. Modern fitness and wellness solutions for a healthier you.",
  applicationName: "Get Fit",
  keywords: ["fitness", "wellness", "calories", "workouts", "deficit"],
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: [{ url: withBasePath("/icon.svg"), type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Get Fit",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}

