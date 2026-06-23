import axiosClient from "../api/axiosClient";
import type {
  BudgetSummaryResponse,
  CategoryReportResponse,
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