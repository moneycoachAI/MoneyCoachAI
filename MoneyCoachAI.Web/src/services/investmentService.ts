import axiosClient from "../api/axiosClient";
import type {
  Investment,
  InvestmentSummary,
  CreateInvestmentRequest,
  InvestmentAllocation
} from "../types/investmentTypes";

export const getInvestments = async (): Promise<Investment[]> => {
  const response = await axiosClient.get("/Investments");
  return response.data;
};

export const createInvestment = async (
  request: CreateInvestmentRequest
) => {
  await axiosClient.post("/Investments", request);
};

export const deleteInvestment = async (id: string) => {
  await axiosClient.delete(`/Investments/${id}`);
};

export const getInvestmentSummary =
  async (): Promise<InvestmentSummary> => {
    const response =
      await axiosClient.get("/Investments/summary");

    return response.data;
  };

  export const getInvestmentAllocation = async (): Promise<
  InvestmentAllocation[]
> => {
  const response = await axiosClient.get<InvestmentAllocation[]>(
    "/Investments/allocation"
  );

  return response.data;
};