'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { setAuthToken, setTenantId } from '@/lib/api/interceptors';
import { handleApiError } from '@/lib/api/error-handler';
import { Button } from '@/components/common/buttons/Button';
import { Input } from '@/components/common/inputs/Input';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@acrmplatform.com');
  const [password, setPassword] = useState('Admin@123456');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.post<any>(API_ENDPOINTS.AUTH.LOGIN, {
        email: email.trim(),
        password,
      });

      setAuthToken(res.accessToken);
      if (res.tenant?.id) {
        setTenantId(res.tenant.id);
      }

      if (res.user.role === 'PLATFORM_ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/workspace/dashboard');
      }
    } catch (err: any) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
          Enterprise AI CRM
        </h2>
        <p className="mt-1 text-center text-xs text-slate-600">
          Sign in to your Platform Admin or Client Workspace
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
                {error}
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Demo Quick Fill
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@acrmplatform.com');
                  setPassword('Admin@123456');
                }}
                className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-left font-medium text-slate-700"
              >
                <div className="font-semibold text-brand-600">Platform Admin</div>
                <div className="text-[10px] text-slate-400">admin@acrmplatform.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('client@jjrealestate.in');
                  setPassword('Client@123456');
                }}
                className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-left font-medium text-slate-700"
              >
                <div className="font-semibold text-emerald-600">Client Workspace</div>
                <div className="text-[10px] text-slate-400">client@jjrealestate.in</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
