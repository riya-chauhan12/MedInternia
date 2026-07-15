import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

/**
 * Guards a page behind authentication.
 * Waits for AuthContext to finish its initial hydration/validation
 * (isLoading) before deciding whether to redirect — this avoids the
 * false-negative redirect that happens if you check auth state before
 * it's actually settled.
 *
 * Usage:
 *   const { isReady, userId } = useRequireAuth();
 *   if (!isReady) return <CircularProgress />; // or null
 *   // ...render the rest of the protected page
 */
export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userId, user } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Still figuring out auth state — don't decide anything yet.
    if (isLoading) return;

    if (!isAuthenticated) {
      const redirectPath = `${router.pathname}${
        typeof window !== 'undefined' ? window.location.search : ''
      }`;
      router.replace(`/auth/login?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    setIsReady(true);
  }, [isLoading, isAuthenticated, router]);

  return { isReady, userId, user };
}