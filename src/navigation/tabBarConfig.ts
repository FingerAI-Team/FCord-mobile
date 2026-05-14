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

// 탭 인덱스 → TabConfig (범위 초과 시 에러)
export function getTabConfig(index: number): TabConfig {
  const config = TAB_CONFIGS[index];
  if (!config) {
    throw new Error(`유효하지 않은 탭 인덱스: ${index} (허용 범위: 0~${TAB_CONFIGS.length - 1})`);
  }
  return config;
}

// 렌더 인덱스 → 라우트 인덱스 변환 (FAB 슬롯이 가운데를 차지하므로 오프셋 적용)
export function renderIndexToRouteIndex(renderIndex: number): number {
  return renderIndex < 2 ? renderIndex : renderIndex - 1;
}

// 렌더 순서에서 인덱스 2는 FAB 슬롯 (탭바 가운데)
export function isFabSlot(renderIndex: number): boolean {
  return renderIndex === 2;
}

export const FAB_SIZE = 60;
export const FAB_OFFSET = 28; // 탭바 위로 튀어나오는 높이 (px)
export const TAB_BAR_HEIGHT = 64;

// 마이크 권한 결과 → FAB 이동 경로 결정
// 'permission_denied'인 경우 호출부에서 Alert.alert 표시
export type FabNavRoute = 'RecordingModal' | 'permission_denied';

export function resolveFabNavRoute(granted: boolean): FabNavRoute {
  return granted ? 'RecordingModal' : 'permission_denied';
}
