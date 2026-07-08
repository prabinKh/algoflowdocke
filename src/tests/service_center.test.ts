
import { describe, it, expect, vi } from 'vitest';
import { repairService } from '../api/repairService';
import axiosInstance from '../api/axiosConfig';

vi.mock('../api/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Service Center / Repair Service API', () => {
  it('should attempt to create a ticket with correct parameters', async () => {
    const mockTicket = {
      category: 'Laptop',
      brand: 'Dell',
      model: 'XPS 15',
      description: 'Screen broken',
      userId: 'test-user-id'
    };

    vi.mocked(axiosInstance.post).mockResolvedValueOnce({
      data: { id: 'ticket-123', ...mockTicket },
    });

    const result = await repairService.submitTicket(mockTicket);

    expect(axiosInstance.post).toHaveBeenCalledWith('/store/service-tickets/create/', mockTicket);
    expect(result.id).toBe('ticket-123');
  });

  it('should throw error when creation fails (e.g. unauthenticated)', async () => {
    vi.mocked(axiosInstance.post).mockRejectedValueOnce({
      response: { status: 403, statusText: 'Forbidden' }
    });

    await expect(repairService.submitTicket({})).rejects.toThrow();
  });

  it('should fetch user-specific tickets', async () => {
    vi.mocked(axiosInstance.get).mockResolvedValueOnce({
      data: [{ id: 't1' }],
    });

    const result = await repairService.getMyTickets();

    expect(axiosInstance.get).toHaveBeenCalledWith('/store/service-tickets/my-tickets/');
    expect(result).toHaveLength(1);
  });
});
