"use client";

import { Button } from "../ui/button";

type ErrorFallbackProps = {
  error: Error;
  reset: () => void;
  title?: string;
};

export default function ErrorFallback({
  error,
  reset,
  title = "Có lỗi xảy ra!",
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 px-4 text-center">
      <h2 className="text-red-600 text-2xl font-bold">{title}</h2>
      <p className="text-gray-600">{error.message}</p>
      <Button
        onClick={() => reset()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Thử lại
      </Button>
    </div>
  );
}
