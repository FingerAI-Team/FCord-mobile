import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { SplashScreen } from './splashScreen';
import { LoginScreen } from './loginScreen';

interface Props {
  /** 인증 후 렌더할 메인 트리 (BottomTabs 등) */
  children: React.ReactNode;
}

// 부팅 시 1회 bootstrap → status에 따라 분기.
// 실제 navigation stack 도입 전 임시 게이트로 사용 가능.
export function AuthGate({ children }: Props): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    if (status === 'booting') {
      void bootstrap();
    }
    // bootstrap은 stable identity (zustand selector) — deps 안전
  }, [status, bootstrap]);

  if (status === 'booting') return <SplashScreen />;
  if (status === 'anonymous') return <LoginScreen />;
  return <>{children}</>;
}
