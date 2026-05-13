import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HanalaFood - Sign Up",
  description: "Create a new HanalaFood account",
};

export default function SignupSegmentLayout({ children }: { children: ReactNode }) {
  return children;
}
