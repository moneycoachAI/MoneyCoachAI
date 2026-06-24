import axiosClient from "../api/axiosClient";
import type {
  NetWorthItem,
  CreateNetWorthItemRequest,
  NetWorthSummary,
} from "../types/netWorthTypes";

export const getNetWorthItems = async (): Promise<
  NetWorthItem[]
> => {
  const response =
    await axiosClient.get<NetWorthItem[]>(
      "/NetWorth"
    );

  return response.data;
};

export const getNetWorthSummary = async (): Promise<
  NetWorthSummary
> => {
  const response =
    await axiosClient.get<NetWorthSummary>(
      "/NetWorth/summary"
    );

  return response.data;
};

export const createNetWorthItem = async (
  request: CreateNetWorthItemRequest
) => {
  await axiosClient.post(
    "/NetWorth",
    request
  );
};

export const deleteNetWorthItem = async (
  id: string
) => {
  await axiosClient.delete(
    `/NetWorth/${id}`
  );
};