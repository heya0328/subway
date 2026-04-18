import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    userId: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function authenticate() {
      try {
        const { AppLogin } = await import('@apps-in-toss/framework');
        if (AppLogin.isSupported?.()) {
          const result = await AppLogin.login();
          setState({ userId: result.userId, isLoading: false, error: null });
          return;
        }
      } catch {
        // 비토스 환경
      }

      // 폴백: 로컬 UUID 생성
      const fallbackId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setState({ userId: fallbackId, isLoading: false, error: null });
    }

    authenticate();
  }, []);

  const retry = useCallback(() => {
    setState({ userId: null, isLoading: true, error: null });
  }, []);

  return { ...state, retry };
}
