"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EnterpriseAnalyticsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/enterprise/income");
  }, [router]);

  return null;
}
