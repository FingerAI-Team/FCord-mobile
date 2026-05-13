// in-memory mock — 단위 테스트에서 service별 저장소 동작 시뮬레이션
type Stored = { username: string; password: string };
const store: Record<string, Stored> = {};

export const getGenericPassword = jest.fn(
  async (opts?: { service?: string }): Promise<Stored | false> => {
    const key = opts?.service ?? '__default__';
    return store[key] ?? false;
  },
);

export const setGenericPassword = jest.fn(
  async (
    username: string,
    password: string,
    opts?: { service?: string },
  ): Promise<{ service: string }> => {
    const key = opts?.service ?? '__default__';
    store[key] = { username, password };
    return { service: key };
  },
);

export const resetGenericPassword = jest.fn(
  async (opts?: { service?: string }): Promise<boolean> => {
    const key = opts?.service ?? '__default__';
    delete store[key];
    return true;
  },
);

// 테스트 헬퍼 (jest.config.js의 moduleNameMapper로 묶이는 모듈에서 직접 호출)
export const __resetKeychainStore = (): void => {
  for (const k of Object.keys(store)) delete store[k];
  getGenericPassword.mockClear();
  setGenericPassword.mockClear();
  resetGenericPassword.mockClear();
};

export default { getGenericPassword, setGenericPassword, resetGenericPassword };
