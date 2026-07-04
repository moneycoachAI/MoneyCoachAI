import axiosClient from "../api/axiosClient";
import type {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "../types/profileTypes";

export const getProfile = async (): Promise<UserProfile> => {
  const response = await axiosClient.get("/Profile");
  return response.data;
};

export const updateProfile = async (
  profile: UpdateProfileRequest
): Promise<UserProfile> => {
  const response = await axiosClient.put("/Profile", profile);
  return response.data;
};

export const changePassword = async (
  request: ChangePasswordRequest
): Promise<void> => {
  await axiosClient.put("/Profile/change-password", request);
};