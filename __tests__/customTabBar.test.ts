// CustomTabBar 핵심 로직: 탭 설정 매핑, FAB 슬롯 판별
import { getTabConfig, isFabSlot } from '../src/navigation/tabBarConfig';

describe('getTabConfig', () => {
  it('Home(0) 탭의 레이블이 홈이다', () => {
    expect(getTabConfig(0).label).toBe('홈');
  });

  it('Search(1) 탭의 레이블이 검색이다', () => {
    expect(getTabConfig(1).label).toBe('검색');
  });

  it('Library(2) 탭의 레이블이 보관함이다', () => {
    expect(getTabConfig(2).label).toBe('보관함');
  });

  it('Profile(3) 탭의 레이블이 프로필이다', () => {
    expect(getTabConfig(3).label).toBe('프로필');
  });
});

describe('isFabSlot', () => {
  it('렌더 인덱스 2는 FAB 슬롯이다', () => {
    expect(isFabSlot(2)).toBe(true);
  });

  it('렌더 인덱스 0은 FAB 슬롯이 아니다', () => {
    expect(isFabSlot(0)).toBe(false);
  });
});
