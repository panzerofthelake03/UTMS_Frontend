import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { login, clearError } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../shared/hooks';
import type { UserRole } from '../../store/authSlice';
import AuthBrandPanel from './AuthBrandPanel';

interface FormValues { email: string; password: string }

function roleHome(role: UserRole): string {
  switch (role) {
    case 'ROLE_STUDENT': return '/student/dashboard';
    case 'ROLE_OIDB':    return '/admin/oidb/applications';
    case 'ROLE_YDYO':    return '/admin/ydyo/applications';
    case 'ROLE_YGK':     return '/admin/ygk/applications';
    case 'ROLE_INTIBAK': return '/admin/intibak/applications';
    case 'ROLE_DEAN':    return '/admin/dean/applications';
    case 'ROLE_ADMIN':   return '/admin/oidb/applications';
  }
}

export default function LoginPage() {
  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();
  const { status, error, user } = useAppSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>();
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) navigate(roleHome(user.role), { replace: true });
    return () => { dispatch(clearError()); };
  }, [user, navigate, dispatch]);

  useEffect(() => {
    if (status === 'failed') setValue('password', '');
  }, [status, setValue]);

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-12 md:px-16">
        <form
          onSubmit={handleSubmit((v) => dispatch(login(v)))}
          className="w-full max-w-md"
          noValidate
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Login</h2>
          <p className="text-sm text-gray-500 mb-8">Enter your credentials to access your account</p>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">
              Email or Username
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email or username"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] transition"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>}
          </div>

          <div className="mb-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b1a1a]/30 focus:border-[#8b1a1a] transition"
                {...register('password', { required: 'Password is required' })}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>}
          </div>

          <div className="text-right mb-7">
            <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-[#8b1a1a] transition">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3 rounded-lg bg-[#8b1a1a] hover:bg-[#6b1414] text-white font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Signing in…' : 'Login'}
          </button>

          <p className="mt-6 text-sm text-center text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#8b1a1a] font-semibold hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
