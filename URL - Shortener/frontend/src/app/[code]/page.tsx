"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function ShortCodeRedirectPage() {
  const params = useParams();
  const code = params.code as string;

  useEffect(() => {
    if (code) {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
      // Forward request to backend redirection engine
      window.location.href = `${backendUrl}/${code}`;
    }
  }, [code]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="text-gray-500 font-medium">Redirecting you to destination...</p>
      </div>
    </div>
  );
}
