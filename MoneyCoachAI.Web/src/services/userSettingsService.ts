import axiosClient from "../api/axiosClient";
import type { UserSettings } from "../types/userSettingsTypes";

export const getUserSettings = async (): Promise<UserSettings> => {
  const response = await axiosClient.get("/UserSettings");
  return response.data;
};

export const updateUserSettings = async (
  settings: UserSettings
): Promise<UserSettings> => {
  const response = await axiosClient.put("/UserSettings", settings);
  return response.data;
};