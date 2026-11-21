'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { handleApiError } from '@/lib/api/error-handler';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { Spinner } from '@/components/common/loaders/Spinner';
import { CheckCircle2, KeyRound } from 'lucide-react';

function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.post(API_ENDPOINTS.AUTH.ACTIVATE, {
        token,
        newPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
      {isSuccess ? (
        <div className="text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Account Activated Successfully!</h3>
          <p className="text-xs text-slate-600 mt-1 mb-6">
            Your company workspace is now active. You may now sign in and complete business onboarding.
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Proceed to Sign In
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleActivate}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {error}
            </div>
          )}

          {!token && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              Notice: No invitation token was detected in the URL. Please ensure you clicked the full activation link from your email.
            </div>
          )}

          <Input
            label="Create Administrator Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
          />

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isLoading}
            disabled={!token}
          >
            Activate Account & Continue
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Activate Your Client Workspace
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          Set your secure administrator password to activate your company account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<Spinner label="Loading activation context..." />}>
          <ActivateAccountForm />
        </Suspense>
      </div>
    </div>
  );
}
