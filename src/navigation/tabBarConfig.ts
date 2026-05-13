// CustomTabBar 설정 — 탭 인덱스 매핑 및 FAB 슬롯 판별 순수 함수

export interface TabConfig {
  label: string;
  icon: string; // 텍스트 아이콘 (추후 벡터 아이콘으로 교체 가능)
}

// 탭 인덱스 0~3 → 설정 (FAB 슬롯 제외)
const TAB_CONFIGS: TabConfig[] = [
  { label: '홈', icon: '🏠' },
  { label: '검색', icon: '🔍' },
  { label: '보관함', icon: '📚' },
  { label: '프로필', icon: '👤' },
];

// 탭 인덱스 → TabConfig
export function getTabConfig(index: number): TabConfig {
  return TAB_CONFIGS[index];
}

// 렌더 순서에서 인덱스 2는 FAB 슬롯 (탭바 가운데)
export function isFabSlot(renderIndex: number): boolean {
  return renderIndex === 2;
}

export const FAB_SIZE = 60;
export const FAB_OFFSET = 28; // 탭바 위로 튀어나오는 높이 (px)
export const TAB_BAR_HEIGHT = 64;
