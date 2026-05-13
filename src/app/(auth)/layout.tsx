import type { ReactNode } from "react";
import { AppProvider } from "@/components/providers/app-provider";
import { AuthShellLayout } from "@/components/auth/auth-shell-layout";

export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <AuthShellLayout>{children}</AuthShellLayout>
    </AppProvider>
  );
}
