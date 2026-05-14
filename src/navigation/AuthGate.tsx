// src/navigation/AuthGate.tsx
import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { SplashScreen } from '../features/auth/splashScreen';
import { resolveAuthRoute } from './resolveAuthRoute';

// 외부에서 import 가능하도록 re-export
export { resolveAuthRoute } from './resolveAuthRoute';

interface Props {
  authStack: React.ReactNode;
  mainStack: React.ReactNode;
}

// AuthGate: status 구독 → booting 시 SplashScreen, 이후 자동 스택 전환
export function AuthGate({ authStack, mainStack }: Props): React.ReactElement {
  const status = useAuthStore((s) => s.status) as 'booting' | 'anonymous' | 'authed';
  const bootstrap = useAuthStore((s) => s.bootstrap) as () => Promise<void>;

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const route = resolveAuthRoute(status);

  if (route === 'loading') {
    return <SplashScreen />;
  }

  return <>{route === 'auth' ? authStack : mainStack}</>;
}
