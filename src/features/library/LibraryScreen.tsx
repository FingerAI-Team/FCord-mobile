import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/tokens';
import { ServerRecordingCache } from '../../types';
import { useRecordingListStore } from '../../stores/recordingListStore';
import { filterStarred, filterArchived, collectAllTags } from './libraryUtils';
import { AppTopBar } from '../../components/AppTopBar';

const TABS = [
  { key: 'starred' as const, label: '즐겨찾기' },
  { key: 'archived' as const, label: '보관함' },
  { key: 'tags' as const, label: '태그' },
];

// 라이브러리 화면: 즐겨찾기 / 보관함 / 태그별 세그먼트 탭 + 카드 리스트
export function LibraryScreen(): React.ReactElement {
  const items = useRecordingListStore((s) => s.items);
  const [activeTab, setActiveTab] = useState<'starred' | 'archived' | 'tags'>('starred');

  const starred = filterStarred(items);
  const archived = filterArchived(items);
  const allTags = collectAllTags(items);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppTopBar title="보관함" showBack active="library" />

      {/* 세그먼트 탭 */}
      <View style={{ paddingHorizontal: 16, marginBottom: 32 }}>
        <View style={{ flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 9999, padding: 4 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                { flex: 1, paddingVertical: 10, borderRadius: 9999, alignItems: 'center' },
                activeTab === tab.key && { backgroundColor: '#111111' },
              ]}
              onPress={() => setActiveTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab.key }}
            >
              <Text style={[
                { fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: '#45464c' },
                activeTab === tab.key && { color: '#ffffff' },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 콘텐츠 */}
      {activeTab === 'tags' ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}>
          {allTags.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-Regular', color: '#9CA3AF' }}>태그가 없습니다</Text>
            </View>
          ) : allTags.map((tag) => (
            <View key={tag} style={{ marginBottom: 48 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, marginBottom: 16 }}>
                <View style={{ width: 8, height: 8, borderRadius: 9999, backgroundColor: '#111111' }} />
                <Text style={{ fontSize: 20, fontFamily: 'Pretendard-Bold', color: '#1b1b1d', lineHeight: 26 }}>{tag}</Text>
              </View>
              {items.filter((r) => r.tags?.includes(tag)).map((r) => (
                <View key={r.id} style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Pretendard-Medium', color: '#45464c', lineHeight: 14, marginBottom: 12 }}>{new Date(r.createdAt).toLocaleDateString('ko-KR')}</Text>
                  <Text style={{ fontSize: 15, fontFamily: 'Pretendard-Bold', color: '#1b1b1d', lineHeight: 22, marginBottom: 8 }}>{r.title}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                    {r.tags?.map((t: string) => (
                      <View key={t} style={{ backgroundColor: '#f0edee', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999 }}>
                        <Text style={{ fontSize: 12, fontFamily: 'Pretendard-Medium', color: '#45464c' }}>#{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={activeTab === 'starred' ? starred : archived}
          keyExtractor={(item: ServerRecordingCache) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          renderItem={({ item }: { item: ServerRecordingCache }) => (
            <View style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Pretendard-Medium', color: '#45464c', marginBottom: 12 }}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text>
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-Bold', color: '#1b1b1d', lineHeight: 22 }}>{item.title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 15, color: '#9CA3AF', fontFamily: 'Pretendard-Regular' }}>
                {activeTab === 'starred' ? '즐겨찾기한 녹음이 없습니다' : '보관된 녹음이 없습니다'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
});
