// src/navigation/LandingScreen.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from './types';
import { colors } from '../theme/tokens';

const ONBOARDED_KEY = '@ibk_stt:onboarded';

interface Props {
  navigation: StackNavigationProp<AuthStackParamList, 'Landing'>;
}

// 온보딩 완료 여부를 확인하여 Login 또는 Onboarding으로 분기하는 스플래시 게이트
export function LandingScreen({ navigation }: Props): React.ReactElement {
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY).then((val) => {
      if (val === 'true') {
        navigation.replace('Login');
      } else {
        navigation.replace('Onboarding');
      }
    }).catch(() => {
      // AsyncStorage 오류 시 Login으로 폴백
      navigation.replace('Login');
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accentBlue} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
