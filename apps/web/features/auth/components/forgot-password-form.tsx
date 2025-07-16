'use client';

import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { authClient } from '@lib/auth-client';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('[DEBUG] Requesting password reset for:', email);
      console.log('[DEBUG] Redirect URL:', `${window.location.origin}/auth/reset-password`);
      
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      console.log('[DEBUG] Password reset result:', result);

      if (result.error) {
        console.error('[DEBUG] Password reset error:', result.error);
        throw new Error(result.error.message);
      }

      console.log('[DEBUG] Password reset request successful');
      setMessage(
        'If an account with that email exists, we\'ve sent you a password reset link. Please check your email and console logs (development mode).'
      );
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Reset your password
        </CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {message && (
          <div className="p-3 rounded-lg text-sm bg-green-50 text-green-800 border border-green-200 mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-700 text-white rounded-lg hover:bg-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-yellow-700 hover:text-yellow-800 font-medium mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </CardContent>
    </div>
  );
}