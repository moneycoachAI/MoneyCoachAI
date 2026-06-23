import axiosClient from "../api/axiosClient";
import type { Expense } from "../types/expenseTypes";
import type { Budget } from "../types/budgetTypes";
import type { MonthlyDashboardCard } from "../types/dashboardTypes";
import type { MonthlyComparison } from "../types/monthlyComparisonTypes";
import type { AiAdvisorInsight } from "../types/aiInsightTypes";

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

export const getTopCategory = async (
  month: number,
  year: number
) => {
  const response = await axiosClient.get(
    `/Dashboard/top-category?month=${month}&year=${year}`
  );

  console.log("API Response:", response.data);

  return response.data;
};

export const getMonthlyComparison = async (
  month: number,
  year: number
): Promise<MonthlyComparison> => {
  const response = await axiosClient.get<MonthlyComparison>(
    `/Dashboard/monthly-comparison?month=${month}&year=${year}`
  );

  return response.data;
};

export const getAiAdvisorInsights = async (
  month: number,
  year: number
): Promise<AiAdvisorInsight[]> => {
  const response = await axiosClient.get<AiAdvisorInsight[]>(
    `/Dashboard/ai-insights?month=${month}&year=${year}`
  );

  return response.data;
};