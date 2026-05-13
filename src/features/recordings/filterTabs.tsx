import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FilterType } from '../../types';

const TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'uploading', label: '업로드 중' },
  { key: 'done', label: '완료' },
  { key: 'failed', label: '실패' },
];

interface Props {
  active: FilterType;
  counts?: Partial<Record<FilterType, number>>;
  onChange: (filter: FilterType) => void;
  style?: ViewStyle; // W3: 부모 controlRow에서 flex: 1 주입 가능
}

export function FilterTabs({ active, counts, onChange, style }: Props): React.ReactElement {
  return (
    <View style={[styles.container, style]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        const count = counts?.[tab.key];
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${tab.label}${count != null ? `, ${count}건` : ''}`}
          >
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
              {count != null && count > 0 ? `  ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeLabel: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
