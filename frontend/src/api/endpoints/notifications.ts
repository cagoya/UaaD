import api from '../axios';
import type { NotificationItem } from '../../types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function getUnreadNotificationCount() {
  const response = await api.get<ApiResponse<{ count: number }>>(
    '/notifications/unread-count',
  );

  return response.data.data.count;
}

export async function listNotifications() {
  const response = await api.get<ApiResponse<NotificationItem[]>>('/notifications');
  return response.data.data;
}

export async function markNotificationAsRead(id: number) {
  await api.put(`/notifications/${id}/read`);
}
