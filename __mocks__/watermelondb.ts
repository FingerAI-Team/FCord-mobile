// Collection<T>: find/create/query 모두 지원하는 완전한 mock
interface MockCollection<T> {
  find: (id: string) => Promise<T>;
  create: (fn: (record: T) => void) => Promise<T>;
  query: (...conditions: unknown[]) => { fetch: () => Promise<T[]> };
}

export class Model {
  static table = '';
  id = '';
  // WatermelonDB 호환 시그니처 — update 콜백의 r 타입이 서브클래스로 추론되게 한다
  async update<T extends Model>(this: T, fn: (record: T) => void): Promise<void> {
    fn(this);
  }
}
export const Q = {
  where: jest.fn((...args: unknown[]) => ({ type: 'where', args })),
  or: jest.fn((...args: unknown[]) => ({ type: 'or', args })),
  and: jest.fn((...args: unknown[]) => ({ type: 'and', args })),
};
export const appSchema = jest.fn((s: unknown) => s);
export const tableSchema = jest.fn((s: unknown) => s);
// @nozbe/watermelondb/Schema/migrations 경로에서 named import로 사용
export const schemaMigrations = jest.fn((s: unknown) => s);

export class Database {
  constructor(_config?: unknown) {}
  get<T = unknown>(_tableName: string): MockCollection<T> {
    return {
      find: jest.fn().mockResolvedValue({} as T),
      create: jest.fn().mockImplementation(async (fn: (r: T) => void) => {
        const r = {} as T;
        fn(r);
        return r;
      }),
      query: jest.fn().mockReturnValue({
        fetch: jest.fn().mockResolvedValue([] as T[]),
      }),
    };
  }
  write = jest.fn(async (fn: () => Promise<void>) => fn());
}

// @nozbe/watermelondb/* 패턴이 이 파일을 공유하므로
// adapters/sqlite의 default import는 이 클래스를 가리킨다
export default class SQLiteAdapter {
  constructor(_config?: unknown) {}
}

export const field = (_columnName: string) => (_: unknown, __: string) => {};
export const readonly = () => {};
