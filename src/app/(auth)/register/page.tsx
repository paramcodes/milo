import { RegisterForm } from '@/features/auth/components/register-form';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow-md border border-[#EBECF0]">
        <div className="flex flex-col items-center mb-6 text-center">
          <h1 className="text-2xl font-bold text-[#172B4D]">Create your account</h1>
          <p className="text-sm text-[#6B778C] mt-1">Get started with Milo boards in seconds</p>
        </div>
        <RegisterForm />
        <div className="mt-6 text-center text-sm text-[#6B778C]">
          Already have an account?{' '}
          <Link href="/login" className="text-[#0052CC] hover:underline font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
