import axiosClient from "../api/axiosClient";
import type { Expense } from "../types/expenseTypes";
import type { Budget } from "../types/budgetTypes";
import type { MonthlyDashboardCard } from "../types/dashboardTypes";

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await axiosClient.get<Expense[]>("/Expenses");
    return response.data;
};

export const getBudgets = async (): Promise<Budget[]> => {
    const response = await axiosClient.get<Budget[]>("/Budgets");
    return response.data;
}

export const getMonthlyDashboardCards = async (
  year: number
): Promise<MonthlyDashboardCard[]> => {
  const response = await axiosClient.get<MonthlyDashboardCard[]>(
    `/Dashboard/monthly-cards?year=${year}`
  );

  return response.data;
};