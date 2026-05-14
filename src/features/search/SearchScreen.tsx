import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearchStore } from '../../stores/searchStore';
import { searchRecordings } from '../../api/recordings';
import { colors, spacing, radius, typography } from '../../theme/tokens';
import { ServerRecordingCache } from '../../types';
import { SearchTab, fieldParam, resolveSearchView } from './searchUtils';

const tabs: { key: SearchTab; label: string }[] = [
  { key: 'title', label: '제목' },
  { key: 'body', label: '본문' },
  { key: 'memo', label: '메모' },
];

// 추천 검색어 고정 목록
const RECOMMENDED = ['어제', '이번 주 회의', '투자전략'];

// 녹음 검색 화면 — 검색바, 최근 검색어, 결과 탭(제목/본문/메모)
export function SearchScreen(): React.ReactElement {
  const inputRef = useRef<typeof TextInput | null>(null);
  const {
    query,
    recentQueries,
    results,
    isSearching,
    setQuery,
    commitQuery,
    removeRecentQuery,
    setResults,
    setSearching,
    setSearchError,
    clearResults,
  } = useSearchStore();
  const [activeTab, setActiveTab] = useState<SearchTab>('title');

  const runSearch = async (q: string, tab: SearchTab) => {
    const trimmed = q.trim();
    if (!trimmed) {
      clearResults();
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const { items } = await searchRecordings({ q: trimmed, field: fieldParam(tab) });
      setResults(items);
    } catch {
      setSearchError('검색 중 오류가 발생했습니다');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onSubmit = () => {
    commitQuery();
    runSearch(query, activeTab);
  };

  const onRecentPress = (q: string) => {
    setQuery(q);
    commitQuery();
    runSearch(q, activeTab);
  };

  const onTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
    if (query.trim()) runSearch(query, tab);
  };

  // 칩 onPress — 쿼리 설정 후 바로 검색 실행
  const onChipPress = (text: string) => {
    setQuery(text);
    commitQuery();
    runSearch(text, activeTab);
  };

  const view = resolveSearchView(query, isSearching, results.length);

  // 결과 카드 렌더러 — 카드 스타일 적용
  const renderResult = ({ item }: { item: ServerRecordingCache }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => { /* navigation.navigate('RecordingDetail', { id: item.id }) */ }}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.resultCardHeader}>
        <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.resultDate}>
          {new Date(item.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}
        </Text>
      </View>
      {item.transcriptPreview ? (
        <Text style={styles.resultPreview} numberOfLines={2}>{item.transcriptPreview}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 검색바 */}
      <View style={styles.searchBarWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={(t: string) => {
            setQuery(t);
            if (!t.trim()) clearResults();
          }}
          placeholder="녹음 검색..."
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={onSubmit}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); clearResults(); }} accessibilityLabel="검색어 지우기">
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 결과 탭 */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 초기 상태 — 검색어 없음: 최근 검색어 칩 + 추천 칩 */}
      {view === 'initial' && (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* 최근 검색어 */}
          {recentQueries && recentQueries.length > 0 && (
            <View style={{ marginTop: 32 }}>
              <Text style={{ fontSize: 13, fontFamily: 'HankenGrotesk-SemiBold', color: '#000000', marginBottom: 12 }}>최근 검색</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {recentQueries.map((q: string) => (
                  <TouchableOpacity
                    key={q}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f6f3f4', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999 }}
                    onPress={() => onRecentPress(q)}
                    accessibilityRole="button"
                    accessibilityLabel={`최근 검색어: ${q}`}
                  >
                    <Text style={{ fontSize: 12, fontFamily: 'HankenGrotesk-Medium', color: '#000000' }}>{q}</Text>
                    <TouchableOpacity onPress={() => removeRecentQuery(q)} accessibilityLabel={`${q} 삭제`}>
                      <Text style={{ fontSize: 11, color: '#585f6c', marginLeft: 2 }}>✕</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          {/* 추천 검색 */}
          <View style={{ marginTop: 32 }}>
            <Text style={{ fontSize: 13, fontFamily: 'HankenGrotesk-SemiBold', color: '#000000', marginBottom: 12 }}>추천</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {RECOMMENDED.map((rec) => (
                <TouchableOpacity
                  key={rec}
                  style={{ backgroundColor: '#f6f3f4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999 }}
                  onPress={() => onChipPress(rec)}
                  accessibilityRole="button"
                >
                  <Text style={{ fontSize: 12, fontFamily: 'HankenGrotesk-Medium', color: '#585f6c' }}>{rec}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* 로딩 */}
      {view === 'loading' && (
        <View style={styles.emptyState}>
          <ActivityIndicator color={colors.accentBlue} size="large" />
        </View>
      )}

      {/* 결과 목록 */}
      {view === 'results' && (
        <FlatList
          data={results}
          keyExtractor={(r: ServerRecordingCache) => r.id}
          renderItem={renderResult}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* 결과 없음 */}
      {view === 'empty' && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          <Text style={styles.emptySubtext}>다른 검색어를 입력해보세요</Text>
        </View>
      )}
    </SafeAreaView>
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
  input: { flex: 1, ...typography.body, color: colors.textPrimary },
  clearIcon: { fontSize: 14, color: colors.textSecondary, padding: spacing.xs },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.sm },
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

  listContent: { paddingHorizontal: 16, paddingBottom: spacing['3xl'] },

  // 결과 카드 스타일
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  resultCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: 'HankenGrotesk-Bold',
    color: '#000000',
    flex: 1,
    marginRight: 16,
  },
  resultDate: {
    fontSize: 12,
    fontFamily: 'HankenGrotesk-Medium',
    color: '#585f6c',
  },
  resultPreview: {
    fontSize: 15,
    fontFamily: 'HankenGrotesk-Regular',
    color: '#585f6c',
    lineHeight: 22,
  },

  emptyState: { flex: 1, alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyText: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  emptySubtext: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
