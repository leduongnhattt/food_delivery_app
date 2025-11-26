"use client";

import ErrorFallback from "@/components/layout/ErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} reset={reset} title="System Error" />;
}
