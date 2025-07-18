import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import type { Session as AuthSession } from "./auth";

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || 
    (process.env.NODE_ENV === "production" 
      ? process.env.NEXT_PUBLIC_APP_URL || "https://k-fin-ten.vercel.app"
      : "http://localhost:3000"),
  plugins: [
    organizationClient()
  ],
});

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient;

// Export password reset methods
export const resetPassword = authClient.resetPassword;

// Debug: Check if methods are available
if (typeof window !== 'undefined') {
  console.log('[DEBUG] authClient methods available:', Object.keys(authClient));
  console.log('[DEBUG] requestPasswordReset available:', !!authClient.requestPasswordReset);
  console.log('[DEBUG] resetPassword available:', !!authClient.resetPassword);
}

export type Session = AuthSession; 