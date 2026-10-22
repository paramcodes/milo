import { LoginForm } from '@/features/auth/components/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-md border border-[#EBECF0]">
        <div className="flex flex-col items-center mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#172B4D]">Log in to Milo</h1>
          <p className="text-sm text-[#6B778C] mt-1">Tactile Kanban for high-velocity teams</p>
        </div>
        <LoginForm />
        <div className="mt-6 text-center text-sm text-[#6B778C]">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#0052CC] hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
