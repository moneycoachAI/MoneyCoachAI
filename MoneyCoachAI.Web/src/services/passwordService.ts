import axiosClient from "../api/axiosClient";

export type ForgotPasswordResponse = {
  message: string;
};

export type ValidateResetTokenResponse = {
  valid: boolean;
};

export type ResetPasswordResponse = {
  message: string;
};

export const requestPasswordReset = async (
  email: string
): Promise<ForgotPasswordResponse> => {
  const response =
    await axiosClient.post<ForgotPasswordResponse>(
      "/Password/forgot",
      {
        email,
      }
    );

  return response.data;
};

export const validateResetToken = async (
  token: string
): Promise<ValidateResetTokenResponse> => {
  const response =
    await axiosClient.post<ValidateResetTokenResponse>(
      "/Password/validate-token",
      {
        token,
      }
    );

  return response.data;
};

export const resetPassword = async (
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<ResetPasswordResponse> => {
  const response =
    await axiosClient.post<ResetPasswordResponse>(
      "/Password/reset",
      {
        token,
        newPassword,
        confirmPassword,
      }
    );

  return response.data;
};