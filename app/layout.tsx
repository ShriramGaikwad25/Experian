import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "./QueryProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthWrapper } from "@/components/AuthWrapper";
import { LeftSidebarProvider } from "@/contexts/LeftSidebarContext";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { RightSidebarProvider } from "@/contexts/RightSidebarContext";
import RightSideBarHost from "@/components/RightSideBarHost";
import LayoutContentShift from "@/components/LayoutContentShift";
import { PageTransitionLoader } from "@/components/PageTransitionLoader";

const inter = Inter({ subsets: ["latin"] });

// Every page renders per request so its scripts carry that request's CSP nonce (middleware.ts);
// a statically generated page would have no nonce and its scripts would be blocked.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KeyForge",
  description: "Identity Security Posture Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <LoadingProvider>
              <RightSidebarProvider>
                <LeftSidebarProvider>
                  <AuthWrapper>
                    <LayoutContentShift>{children}</LayoutContentShift>
                  </AuthWrapper>
                  <RightSideBarHost />
                  <PageTransitionLoader />
                </LeftSidebarProvider>
              </RightSidebarProvider>
            </LoadingProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
