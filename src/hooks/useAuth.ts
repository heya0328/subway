import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

// 세션 동안 동일한 userId 유지
let cachedUserId: string | null = null;

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    userId: cachedUserId,
    isLoading: cachedUserId === null,
    error: null,
  });

  useEffect(() => {
    if (cachedUserId) {
      setState({ userId: cachedUserId, isLoading: false, error: null });
      return;
    }

    async function authenticate() {
      try {
        const { AppLogin } = await import('@apps-in-toss/framework');
        if (AppLogin.isSupported?.()) {
          const result = await AppLogin.login();
          cachedUserId = result.userId;
          setState({ userId: cachedUserId, isLoading: false, error: null });
          return;
        }
      } catch {
        // 비토스 환경
      }

      cachedUserId = 'mozy-dev-user';
      setState({ userId: cachedUserId, isLoading: false, error: null });
    }

    authenticate();
  }, []);

  const retry = useCallback(() => {
    cachedUserId = null;
    setState({ userId: null, isLoading: true, error: null });
  }, []);

  return { ...state, retry };
}
