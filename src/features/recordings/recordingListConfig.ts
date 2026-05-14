import { FilterType } from '../../types';

export const EMPTY_MESSAGES: Record<FilterType, string> = {
  all: '녹음을 시작해보세요',
  uploading: '업로드 중인 파일이 없습니다',
  done: '완료된 파일이 없습니다',
  failed: '실패한 파일이 없습니다',
};
