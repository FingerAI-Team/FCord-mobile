import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { colors } from '../theme/tokens';
import { resolveAuthRoute } from './resolveAuthRoute';

// 외부에서 import 가능하도록 re-export
export { resolveAuthRoute } from './resolveAuthRoute';

interface Props {
  authStack: React.ReactNode;
  mainStack: React.ReactNode;
}

// AuthGate: status 구독 → 자동 스택 전환
export function AuthGate({ authStack, mainStack }: Props): React.ReactElement {
  const status = useAuthStore((s) => s.status) as 'booting' | 'anonymous' | 'authed';
  const bootstrap = useAuthStore((s) => s.bootstrap) as () => Promise<void>;

  React.useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const route = resolveAuthRoute(status);

  if (route === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  return <>{route === 'auth' ? authStack : mainStack}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
