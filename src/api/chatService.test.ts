import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chatService';
import axiosInstance from './axiosConfig';

vi.mock('./axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('chatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getOrCreateSession should return session', async () => {
    const mockSession = { id: 'session_1', status: 'active' };
    
    // First call to get sessions returns empty
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({ data: [] });
    // Second call to create session returns mockSession
    vi.mocked(axiosInstance.post).mockResolvedValueOnce({ data: mockSession });

    const result = await chatService.getOrCreateSession(
      'guest_1',
      'guest@example.com',
      'Guest'
    );
    
    expect(result).toEqual(mockSession.id);
  });

  it('sendMessage should successfully send message', async () => {
    const mockMessage = { id: 1, text: 'Hello' };
    vi.mocked(axiosInstance.post).mockResolvedValue({ data: mockMessage });

    const result = await chatService.sendMessage('session_1', 'Hello', 'user');
    expect(axiosInstance.post).toHaveBeenCalledWith('/chat/chat-messages/', expect.any(Object));
    expect(result).toEqual(mockMessage);
  });
});
