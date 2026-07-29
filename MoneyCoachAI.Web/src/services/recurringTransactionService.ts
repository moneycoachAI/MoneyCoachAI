import axiosClient from "../api/axiosClient";
import type {
  CreateRecurringTransactionRequest,
  RecurringTransaction,
} from "../types/recurringTransactionTypes";

const RECURRING_TRANSACTIONS_URL = "/RecurringTransactions";

export const recurringTransactionService = {
  async getRecurringTransactions(): Promise<RecurringTransaction[]> {
    const response = await axiosClient.get<RecurringTransaction[]>(
      RECURRING_TRANSACTIONS_URL
    );

    return response.data;
  },

  async getDashboardReminders(): Promise<RecurringTransaction[]> {
    const response = await axiosClient.get<RecurringTransaction[]>(
      `${RECURRING_TRANSACTIONS_URL}/dashboard`
    );

    return response.data;
  },

  async createRecurringTransaction(
    request: CreateRecurringTransactionRequest
  ): Promise<RecurringTransaction> {
    const response = await axiosClient.post<RecurringTransaction>(
      RECURRING_TRANSACTIONS_URL,
      request
    );

    return response.data;
  },

  async updateRecurringTransaction(
    id: string,
    request: CreateRecurringTransactionRequest
  ): Promise<void> {
    await axiosClient.put(
      `${RECURRING_TRANSACTIONS_URL}/${id}`,
      request
    );
  },

  async completeRecurringReminder(
    id: string
  ): Promise<RecurringTransaction> {
    const response = await axiosClient.post<RecurringTransaction>(
      `${RECURRING_TRANSACTIONS_URL}/${id}/complete`
    );

    return response.data;
  },

  async pauseRecurringReminder(id: string): Promise<void> {
    await axiosClient.post(
      `${RECURRING_TRANSACTIONS_URL}/${id}/pause`
    );
  },

  async resumeRecurringReminder(id: string): Promise<void> {
    await axiosClient.post(
      `${RECURRING_TRANSACTIONS_URL}/${id}/resume`
    );
  },

  async deleteRecurringTransaction(id: string): Promise<void> {
    await axiosClient.delete(
      `${RECURRING_TRANSACTIONS_URL}/${id}`
    );
  },
};

export default recurringTransactionService;