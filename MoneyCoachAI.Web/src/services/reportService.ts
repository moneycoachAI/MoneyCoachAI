import axiosClient from "../api/axiosClient";
import type {
  BudgetSummaryResponse,
  CategoryReportResponse,
  MoneyDueReportResponse,
  MonthlyReportResponse,
} from "../types/reportTypes";

export const getMonthlyReport = async (
  month: number,
  year: number
): Promise<MonthlyReportResponse> => {
  const response = await axiosClient.get<MonthlyReportResponse>(
    `/Reports/monthly?month=${month}&year=${year}`
  );

  return response.data;
};

export const getCategoryReport = async (
  month: number,
  year: number
): Promise<CategoryReportResponse[]> => {
  const response = await axiosClient.get<CategoryReportResponse[]>(
    `/Reports/categories?month=${month}&year=${year}`
  );

  return response.data;
};

export const getBudgetSummary = async (
  month: number,
  year: number
): Promise<BudgetSummaryResponse[]> => {
  const response = await axiosClient.get<BudgetSummaryResponse[]>(
    `/Reports/budget-summary?month=${month}&year=${year}`
  );

  return response.data;
};

export const exportMonthlyPdf = async (
  month: number,
  year: number
): Promise<Blob> => {
  const response = await axiosClient.get(
    `/Reports/monthly-pdf?month=${month}&year=${year}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};

export const exportAnnualPdf = async (
  year: number
): Promise<Blob> => {
  const response = await axiosClient.get(
    `/Reports/annual-pdf?year=${year}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};

export const getMoneyDueReport = async (
  month: number,
  year: number
): Promise<MoneyDueReportResponse> => {
  const response = await axiosClient.get<MoneyDueReportResponse>(
    `/Reports/money-due?month=${month}&year=${year}`
  );

  return response.data;
};