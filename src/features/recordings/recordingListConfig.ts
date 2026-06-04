import { FilterType } from '../../types';

export const EMPTY_MESSAGES: Record<FilterType, string> = {
  all: '녹음을 시작해보세요',
  processing: '처리 중인 파일이 없습니다',
  done: '완료된 파일이 없습니다',
  starred: '즐겨찾기한 항목이 없습니다',
};
