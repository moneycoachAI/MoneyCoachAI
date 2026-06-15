import axiosClient from "../api/axiosClient";
import type {
  Budget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from "../types/budgetTypes";

export const getBudgets = async (): Promise<Budget[]> => {
  const response = await axiosClient.get<Budget[]>("/Budgets");
  return response.data;
};

export const createBudget = async (
  data: CreateBudgetRequest
): Promise<string> => {
  const response = await axiosClient.post<string>("/Budgets", data);
  return response.data;
};

export const updateBudget = async (
  id: string,
  data: UpdateBudgetRequest
): Promise<string> => {
  const response = await axiosClient.put<string>(`/Budgets/${id}`, data);
  return response.data;
};

export const deleteBudget = async (id: string): Promise<string> => {
  const response = await axiosClient.delete<string>(`/Budgets/${id}`);
  return response.data;
};