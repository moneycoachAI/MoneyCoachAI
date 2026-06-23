import axiosClient from "../api/axiosClient";
import type {
  FinancialGoal,
  CreateFinancialGoalRequest,
} from "../types/financialGoalTypes";
import type { GoalRecommendation } from "../types/goalRecommendationTypes";

export const getFinancialGoals = async (): Promise<
  FinancialGoal[]
> => {
  const response =
    await axiosClient.get<FinancialGoal[]>(
      "/FinancialGoals"
    );

  return response.data;
};

export const createFinancialGoal = async (
  request: CreateFinancialGoalRequest
) => {
  await axiosClient.post(
    "/FinancialGoals",
    request
  );
};

export const addGoalProgress = async (
  goalId: string,
  amount: number
) => {
  await axiosClient.put(
    `/FinancialGoals/${goalId}/progress?amount=${amount}`
  );
};

export const deleteFinancialGoal = async (
  goalId: string
) => {
  await axiosClient.delete(
    `/FinancialGoals/${goalId}`
  );
};

export const getGoalRecommendations = async (): Promise<
  GoalRecommendation[]
> => {
  const response = await axiosClient.get<GoalRecommendation[]>(
    "/FinancialGoals/recommendations"
  );

  return response.data;
};