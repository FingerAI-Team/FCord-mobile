import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/tokens';

type LibrarySection = 'starred' | 'archived' | 'tags';

interface Section {
  key: LibrarySection;
  title: string;
  icon: string;
  data: string[];
}

// 보관함 화면: 즐겨찾기 / 보관함 / 태그별 섹션 + 태그 편집 모달
export function LibraryScreen(): React.ReactElement {
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState('');

  // 3개 섹션 정의 — 현재는 빈 data, 추후 items에서 필터링하여 채움
  const sections: Section[] = [
    {
      key: 'starred',
      title: '즐겨찾기',
      icon: '⭐',
      data: [],
    },
    {
      key: 'archived',
      title: '보관함',
      icon: '📦',
      data: [],
    },
    {
      key: 'tags',
      title: '태그별',
      icon: '🏷',
      data: [],
    },
  ];

  // 섹션 헤더: 제목 + 태그 섹션에만 편집 링크
  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionIcon}>{section.icon}</Text>
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      {section.key === 'tags' && (
        <TouchableOpacity
          onPress={() => setTagModalVisible(true)}
          accessibilityLabel="태그 편집"
        >
          <Text style={styles.editLink}>편집</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // 섹션 데이터가 없을 때 표시할 빈 상태 메시지
  const renderEmptyForSection = (section: Section) => (
    <View style={styles.sectionEmpty}>
      <Text style={styles.sectionEmptyText}>
        {section.key === 'starred' && '즐겨찾기한 녹음이 없습니다'}
        {section.key === 'archived' && '보관함이 비어있습니다'}
        {section.key === 'tags' && '태그가 없습니다'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>보관함</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item: string, index: number) => `${item}-${index}`}
        renderSectionHeader={renderSectionHeader}
        renderItem={({ item }: { item: string }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item}</Text>
          </View>
        )}
        renderSectionFooter={({ section }: { section: Section }) =>
          section.data.length === 0 ? renderEmptyForSection(section) : null
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
      />

      {/* 태그 편집 Bottom Sheet 모달 */}
      <Modal
        visible={tagModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTagModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>태그 편집</Text>
            <TextInput
              style={styles.tagInput}
              value={editingTag}
              onChangeText={setEditingTag}
              placeholder="새 태그 입력"
              placeholderTextColor={colors.textSecondary}
            />
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setTagModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  headerTitle: { ...typography.heading, color: colors.textPrimary, fontSize: 24, fontWeight: '800' },

  listContent: { paddingBottom: spacing['3xl'] },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { ...typography.label, color: colors.textSecondary },
  editLink: { ...typography.caption, color: colors.accentBlue },

  sectionEmpty: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionEmptyText: { ...typography.body, color: colors.textSecondary },

  item: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemText: { ...typography.body, color: colors.textPrimary },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.lg },
  tagInput: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalClose: {
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCloseText: { ...typography.label, color: colors.accentBlue },
});
