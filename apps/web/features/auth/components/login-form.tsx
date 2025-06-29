'use client';

import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setUser, setLoading } = useAppStore();

  const handleSocialLogin = async (provider: 'google') => {
    setIsLoading(true);
    try {
      const result = await signIn.social({
        provider: 'google',
        callbackURL: '/org/select',
      });
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error('Social login error:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        const result = await signUp.email({
          email,
          name: email.split('@')[0], // Use email prefix as default name
          password,
          callbackURL: '/org/select',
        });
        if (result.error) {
          throw new Error(result.error.message);
        }
        setError('Account created successfully! You can now sign in.');
        setIsSignUp(false);
      } else {
        const result = await signIn.email({
          email,
          password,
          callbackURL: '/org/select',
        });
        if (result.error) {
          throw new Error(result.error.message);
        }
        router.push('/org/select');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </CardTitle>
        <CardDescription>
          {isSignUp ? 'Join the financial analysis platform' : 'Welcome back to your overview'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className={`p-3 rounded-lg text-sm ${
            error.includes('Check your email') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-600 rounded-lg bg-white text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailPasswordAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full px-3 py-2 border-2 border-gray-600 rounded-lg bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full px-3 py-2 pr-10 border-2 border-gray-600 rounded-lg bg-white text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-yellow-700 hover:text-yellow-800 font-medium"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </CardContent>
    </div>
  );
} 