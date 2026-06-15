import axiosClient from "../api/axiosClient";
import type { SuggestionResponse } from "../types/suggestionTypes";

export const getSuggestions = async (
  month: number,
  year: number
): Promise<SuggestionResponse[]> => {
  const response = await axiosClient.get<SuggestionResponse[]>(
    `/Suggestion?month=${month}&year=${year}`
  );

  return response.data;
};