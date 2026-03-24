import type { ReactNode } from "react";
import "../globals.css";
import type { Metadata } from "next";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: "HanalaFood - Forgot Password",
  description: "Reset your HanalaFood account password",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
