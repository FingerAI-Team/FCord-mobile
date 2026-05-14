export class Model {
  static table = '';
  id = '';
  update = jest.fn();
}
export const Q = {
  where: jest.fn((...args) => ({ type: 'where', args })),
  or: jest.fn((...args) => ({ type: 'or', args })),
  and: jest.fn((...args) => ({ type: 'and', args })),
};
export const appSchema = jest.fn((s) => s);
export const tableSchema = jest.fn((s) => s);
export class Database {
  get<_T = unknown>(_tableName: string): { query: jest.Mock } {
    return { query: jest.fn().mockReturnValue({ fetch: jest.fn().mockResolvedValue([]) }) };
  }
  write = jest.fn(async (fn: () => Promise<void>) => fn());
}
export const field = () => (_: unknown, __: string) => {};
export const readonly = () => {};
export default {};
