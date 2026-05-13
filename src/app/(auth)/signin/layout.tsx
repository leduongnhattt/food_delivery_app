import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HanalaFood - Sign In",
  description: "Sign in to your FoodieExpress account",
};

export default function SigninSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
