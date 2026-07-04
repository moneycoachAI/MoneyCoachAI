import axiosClient from "../api/axiosClient";
import type { Notification } from "../types/notificationTypes";

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await axiosClient.get("/Notifications");
  return response.data;
};

export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const response = await axiosClient.get("/Notifications/unread");
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  await axiosClient.put(`/Notifications/read/${id}`);
};

export const markAllNotificationsAsRead = async () => {
  await axiosClient.put("/Notifications/read-all");
};

export const deleteNotification = async (id: string) => {
  await axiosClient.delete(`/Notifications/${id}`);
};