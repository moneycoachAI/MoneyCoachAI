import axiosClient from "../api/axiosClient";

import type {
  AIAdviceRequest,
  AIAdviceResponse,
} from "../types/aiTypes";

export const getAIAdvice = async (
  data: AIAdviceRequest
): Promise<AIAdviceResponse> => {
  const response = await axiosClient.post<AIAdviceResponse>(
    "/AI/advice",
    data
  );

  return response.data;
};