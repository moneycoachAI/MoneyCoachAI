export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}