import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiError } from '@/services/api-client';

describe('ApiClient Foundation', () => {
  let client: ApiClient;

  beforeEach(() => {
    localStorage.clear();
    client = new ApiClient();
    vi.restoreAllMocks();
  });

  it('stores and retrieves JWT authentication tokens in local storage', () => {
    expect(client.getToken()).toBeNull();
    client.setToken('test.jwt.token', 'test.refresh.token', {
      id: '123',
      email: 'alex@example.com',
      fullName: 'Alex Carter',
      role: 'ROLE_CUSTOMER',
      createdAt: new Date().toISOString(),
    });

    expect(client.getToken()).toBe('test.jwt.token');
    expect(client.getStoredUser()?.email).toBe('alex@example.com');

    client.clearToken();
    expect(client.getToken()).toBeNull();
    expect(client.getStoredUser()).toBeNull();
  });

  it('attaches Authorization header when token is present', async () => {
    client.setToken('valid.jwt.token');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [{ id: 'card-1' }] }),
    });
    global.fetch = mockFetch;

    const cards = await client.getCards();
    expect(cards).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/cards'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid.jwt.token',
        }),
      })
    );
  });

  it('throws ApiError with status and message on failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        message: 'Requested amount exceeds policy limit',
        errorCode: 'VALIDATION_ERROR',
      }),
    });

    await expect(client.getCards()).rejects.toThrow(ApiError);
    await expect(client.getCards()).rejects.toMatchObject({
      status: 400,
      message: 'Requested amount exceeds policy limit',
      errorCode: 'VALIDATION_ERROR',
    });
  });
});
