jest.mock('../src/auth/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue(null),
  },
}));

import { apiRequest, ApiError } from '../src/api/client';

describe('apiRequest', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('204 No Content 응답은 undefined로 처리한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      text: jest.fn().mockResolvedValue(''),
    }) as unknown as typeof fetch;

    await expect(apiRequest<void>('DELETE', '/v1/recordings/rec_001')).resolves.toBeUndefined();
  });

  it('본문이 비어있는 200 응답도 undefined로 처리한다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    }) as unknown as typeof fetch;

    await expect(apiRequest<void>('PATCH', '/v1/recordings/rec_001')).resolves.toBeUndefined();
  });

  it('비정상 응답은 ApiError로 던진다', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: jest.fn().mockResolvedValue('server exploded'),
    }) as unknown as typeof fetch;

    await expect(apiRequest('GET', '/v1/recordings')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    } satisfies Partial<ApiError>);
  });
});
