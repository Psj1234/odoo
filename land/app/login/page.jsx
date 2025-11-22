 'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const { requestOTP, login, loading, error } = useAuth();
  const router = useRouter();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    const result = await requestOTP(phone);
    if (result.success) {
      setStep('code');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const result = await login(phone, code);
    if (result.success) {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:5173';
      window.location.href = frontendUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Package className="w-12 h-12 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">StockMaster</h1>
          </div>
          <p className="text-gray-600">Inventory Management System</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {step === 'phone' ? (
            <form onSubmit={handleRequestOTP}>
              <h2 className="text-2xl font-semibold mb-6">Login</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use E.164 format (e.g., +1234567890)
                </p>
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
              {process.env.NODE_ENV === 'development' && (
                <p className="mt-4 text-xs text-gray-500 text-center">
                  Dev mode: Use code 123456
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <h2 className="text-2xl font-semibold mb-6">Enter OTP</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={6}
                  required
                />
              </div>
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
