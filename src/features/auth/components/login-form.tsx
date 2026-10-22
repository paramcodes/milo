'use client';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useTransition } from 'react';
import { loginAction } from '../auth.api';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (!result.success) {
        setError(result.error.message);
      } else {
        router.push('/');
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {error && (
        <div className="p-3 text-sm rounded bg-[#FFEBE6] text-[#BF2600] border border-[#FFBDAD]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-semibold text-[#6B778C] uppercase">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-semibold text-[#6B778C] uppercase">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
