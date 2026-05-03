import axiosInstance from './axiosInstance';

export interface Notification {
  id: number;
  applicationId: number | null;
  notificationType: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  sentAt: string;
  createdAt: string;
}

export const notificationApi = {
  list: () =>
    axiosInstance.get<{ data: Notification[] }>('/api/notifications'),
  unreadCount: () =>
    axiosInstance.get<{ data: { unreadCount: number } }>('/api/notifications/unread-count'),
  markRead: (id: number) =>
    axiosInstance.post<{ data: Notification }>(`/api/notifications/${id}/read`),
};
