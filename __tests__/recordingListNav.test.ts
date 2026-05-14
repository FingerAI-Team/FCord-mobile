// RecordingListScreen 빈 상태 메시지 + FAB 권한→이동 결정 로직 테스트

import { EMPTY_MESSAGES } from '../src/features/recordings/recordingListConfig';
import { resolveFabNavRoute } from '../src/navigation/tabBarConfig';

// --- 빈 목록 상태 메시지 ---
describe('빈 목록 상태 메시지 (EMPTY_MESSAGES)', () => {
  it('filter=all → "녹음을 시작해보세요"', () => {
    expect(EMPTY_MESSAGES['all']).toBe('녹음을 시작해보세요');
  });

  it('filter=uploading → "업로드 중인 파일이 없습니다"', () => {
    expect(EMPTY_MESSAGES['uploading']).toBe('업로드 중인 파일이 없습니다');
  });

  it('filter=done → "완료된 파일이 없습니다"', () => {
    expect(EMPTY_MESSAGES['done']).toBe('완료된 파일이 없습니다');
  });

  it('filter=failed → "실패한 파일이 없습니다"', () => {
    expect(EMPTY_MESSAGES['failed']).toBe('실패한 파일이 없습니다');
  });
});

// --- FAB 권한 결과 → 네비게이션 경로 결정 ---
describe('마이크 권한 결과 → FAB 이동 경로 (resolveFabNavRoute)', () => {
  it('권한 허용 → RecordingModal로 이동', () => {
    expect(resolveFabNavRoute(true)).toBe('RecordingModal');
  });

  it('권한 거부 → permission_denied (Alert 표시, 화면 이동 없음)', () => {
    expect(resolveFabNavRoute(false)).toBe('permission_denied');
  });
});
