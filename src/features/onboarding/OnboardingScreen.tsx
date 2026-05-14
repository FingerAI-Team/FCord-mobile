// src/features/onboarding/OnboardingScreen.tsx
import React, { useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, ListRenderItem,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, radius, typography } from '../../theme/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const ONBOARDED_KEY = '@ibk_stt:onboarded';

interface Slide {
  id: string;
  emoji: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    emoji: '🎙',
    title: '회의 내용을 더 정확하게',
    body: '오프라인 환경에서도 끊김 없이 녹음하고 실시간으로 저장하세요.',
  },
  {
    id: '2',
    emoji: '📤',
    title: '자동 업로드 & 재시도',
    body: '네트워크가 연결되면 자동으로 업로드됩니다. 실패해도 큐에서 자동 재시도합니다.',
  },
  {
    id: '3',
    emoji: '📝',
    title: '전사 결과를 텍스트로',
    body: 'AI가 변환한 전사 결과를 확인하고 편집해 영구 보관하세요.',
  },
];

interface Props {
  navigation: any;
}

export function OnboardingScreen({ navigation }: Props): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flatRef = useRef<any>(null);
  const [current, setCurrent] = useState(0);

  const isLast = current === SLIDES.length - 1;

  const onNext = async () => {
    if (isLast) {
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
      navigation.replace('PermissionPrimer');
    } else {
      const next = current + 1;
      flatRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrent(next);
    }
  };

  const onSkip = async () => {
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    navigation.replace('Login');
  };

  const renderSlide: ListRenderItem<Slide> = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={styles.illustrationBox}>
        <Text style={styles.illustrationEmoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideBody}>{item.body}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={onSkip} accessibilityLabel="온보딩 건너뛰기">
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item: Slide) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_: unknown, index: number) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === current && styles.dotActive]}
            accessibilityLabel={`슬라이드 ${i + 1} / ${SLIDES.length}`}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? '시작하기' : '다음'}
        >
          <Text style={styles.nextBtnText}>{isLast ? '시작하기' : '다음'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skipRow: {
    height: 64,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  skipText: { ...typography.label, color: colors.secondary },
  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  illustrationBox: {
    width: 140,
    height: 140,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['3xl'],
  },
  illustrationEmoji: { fontSize: 64 },
  slideTitle: {
    ...typography.heading,
    color: colors.textPrimaryLight,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  slideBody: {
    ...typography.body,
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing['3xl'],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.borderLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  nextBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { ...typography.label, color: colors.onPrimary, fontSize: 15 },
});
