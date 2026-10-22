import { logoutAction } from '@/features/auth/auth.api';
import { getUserFromSession } from '@/features/auth/auth.service';
import { SESSION_COOKIE_NAME } from '@/server/auth/session';
import { Button } from '@/shared/ui/button';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type React from 'react';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login');
  }

  const userResult = await getUserFromSession(token);
  if (!userResult.success) {
    redirect('/login');
  }

  const user = userResult.data;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFC]">
      <header className="h-12 border-b border-[#EBECF0] bg-white px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-[#0052CC]">
            <span className="w-5 h-5 bg-[#0052CC] text-white rounded flex items-center justify-center text-xs">
              M
            </span>
            Milo
          </Link>
          <span className="text-xs text-[#6B778C] font-medium hidden sm:inline">
            Tactile Kanban
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[#172B4D] font-medium hidden sm:inline">{user.name}</span>
          <form
            action={async () => {
              'use server';
              await logoutAction();
              redirect('/login');
            }}
          >
            <Button type="submit" variant="subtle" size="sm">
              Log out
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
