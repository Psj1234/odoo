'use client';

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    // Redirect to frontend login page
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173/login';
    window.location.href = frontendUrl;
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
