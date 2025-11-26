import type { ReactNode } from "react";
import "../globals.css";
import type { Metadata } from "next";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: "HanalaFood - Sign Up",
  description: "Create a new HanalaFood account",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
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
