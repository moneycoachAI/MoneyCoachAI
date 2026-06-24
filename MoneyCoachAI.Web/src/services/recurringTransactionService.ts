import axiosClient from "../api/axiosClient";
import type {
  CreateRecurringTransactionRequest,
  RecurringTransaction,
} from "../types/recurringTransactionTypes";

export const getRecurringTransactions = async (): Promise<
  RecurringTransaction[]
> => {
  const response = await axiosClient.get<RecurringTransaction[]>(
    "/RecurringTransactions"
  );

  return response.data;
};

export const createRecurringTransaction = async (
  request: CreateRecurringTransactionRequest
) => {
  await axiosClient.post("/RecurringTransactions", request);
};

export const deleteRecurringTransaction = async (id: string) => {
  await axiosClient.delete(`/RecurringTransactions/${id}`);
};

export const generateRecurringTransactions = async (
  month: number,
  year: number
): Promise<string> => {
  const response = await axiosClient.post<string>(
    `/RecurringTransactions/generate?month=${month}&year=${year}`
  );

  return response.data;
};