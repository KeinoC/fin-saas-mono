import { useEffect } from 'react';
import { useSession } from '@lib/auth-client';
import { useAppStore } from '@lib/stores/app-store';
import { useRouter } from 'next/navigation';

export function useSessionSync() {
  const { data: session, isPending } = useSession();
  const { setUser, setLoading, clearState } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isPending) {
      setLoading(true);
      return;
    }

    if (!session?.user) {
      clearState();
      return;
    }

    // Update user in store
    setUser({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });

    setLoading(false);
  }, [session, isPending, setUser, setLoading, clearState]);

  return {
    session,
    isPending,
    isAuthenticated: !!session?.user
  };
} 