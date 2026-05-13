import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ visible, title, onConfirm, onCancel }: Props): React.ReactElement {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.heading}>녹음 삭제</Text>
          <Text style={styles.body}>
            <Text style={styles.highlight}>"{title}"</Text>을(를) 삭제할까요?{'\n'}
            삭제하면 복구할 수 없습니다.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              accessibilityLabel="취소"
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={onConfirm}
              accessibilityLabel="삭제 확인"
              accessibilityRole="button"
            >
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '82%',
    maxWidth: 360,
  },
  heading: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 24 },
  highlight: { fontWeight: '700', color: '#111827' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#374151', fontWeight: '600' },
  deleteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  deleteText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700' },
});
