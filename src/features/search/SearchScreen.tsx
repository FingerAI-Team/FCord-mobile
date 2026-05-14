import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSearchStore } from '../../stores/searchStore';
import { colors, spacing, radius, typography } from '../../theme/tokens';

type SearchTab = 'title' | 'body' | 'memo';

// 녹음 검색 화면 — 검색바, 최근 검색어, 결과 탭(제목/본문/메모)
export function SearchScreen(): React.ReactElement {
  const inputRef = useRef<typeof TextInput | null>(null);
  const { query, recentQueries, setQuery, commitQuery, removeRecentQuery } = useSearchStore();
  const [activeTab, setActiveTab] = useState<SearchTab>('title');

  const onSubmit = () => {
    commitQuery();
    // 실제 API 호출은 추후 구현
  };

  const onRecentPress = (q: string) => {
    setQuery(q);
    commitQuery();
  };

  const tabs: { key: SearchTab; label: string }[] = [
    { key: 'title', label: '제목' },
    { key: 'body', label: '본문' },
    { key: 'memo', label: '메모' },
  ];

  return (
    <View style={styles.container}>
      {/* 검색바 */}
      <View style={styles.searchBarWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="녹음 검색..."
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="검색어 지우기">
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 결과 탭 (state 기반 3버튼, 추가 패키지 없음) */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        {/* 최근 검색어 (쿼리 없을 때만 표시) */}
        {query.length === 0 && recentQueries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>최근 검색어</Text>
            <View style={styles.chipRow}>
              {recentQueries.map((q) => (
                <View key={q} style={styles.chip}>
                  <TouchableOpacity onPress={() => onRecentPress(q)}>
                    <Text style={styles.chipText}>{q}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeRecentQuery(q)}
                    accessibilityLabel={`${q} 삭제`}
                  >
                    <Text style={styles.chipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 검색 결과 영역 (추후 API 연결) */}
        {query.length > 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
            <Text style={styles.emptySubtext}>다른 검색어를 입력해보세요</Text>
          </View>
        )}

        {/* 초기 상태 */}
        {query.length === 0 && recentQueries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎙</Text>
            <Text style={styles.emptyText}>녹음을 검색하세요</Text>
            <Text style={styles.emptySubtext}>제목, 전사 본문, 메모로 검색할 수 있습니다</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    height: 48,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  clearIcon: { fontSize: 14, color: colors.textSecondary, padding: spacing.xs },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabLabel: { ...typography.label, color: colors.textSecondary },
  tabLabelActive: { color: colors.textPrimary },

  body: { flex: 1 },

  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  chipText: { ...typography.body, color: colors.textPrimary, fontSize: 13 },
  chipRemove: { color: colors.textSecondary, fontSize: 12 },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyText: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
