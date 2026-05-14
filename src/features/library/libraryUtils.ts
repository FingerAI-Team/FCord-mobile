import { ServerRecordingCache } from '../../types';

export function filterStarred(items: ServerRecordingCache[]): ServerRecordingCache[] {
  return items.filter((r) => r.isStarred === true);
}

export function filterArchived(items: ServerRecordingCache[]): ServerRecordingCache[] {
  return items.filter((r) => r.recordingState === 'archived');
}

// 모든 항목의 태그를 모아 중복 제거 후 알파벳 순 정렬
export function collectAllTags(items: ServerRecordingCache[]): string[] {
  const tagSet = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
}
