import axiosClient from "../api/axiosClient";
import type {
  CreateIncomeRequest,
  Income,
  UpdateIncomeRequest,
} from "../types/incomeTypes";

export const getIncomes = async (): Promise<Income[]> => {
  const response = await axiosClient.get<Income[]>("/Incomes");

  return response.data;
};

export const createIncome = async (
  data: CreateIncomeRequest
): Promise<string> => {
  const response = await axiosClient.post<string>("/Incomes", data);

  return response.data;
};

export const updateIncome = async (
  id: string,
  data: UpdateIncomeRequest
): Promise<string> => {
  const response = await axiosClient.put<string>(
    `/Incomes/${id}`,
    data
  );

  return response.data;
};

export const deleteIncome = async (id: string): Promise<string> => {
  const response = await axiosClient.delete<string>(
    `/Incomes/${id}`
  );

  return response.data;
};