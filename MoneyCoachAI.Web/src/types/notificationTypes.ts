export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceKey?: string;
  isRead: boolean;
  createdAt: string;
}