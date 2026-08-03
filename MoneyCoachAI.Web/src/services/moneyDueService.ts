import axiosClient from "../api/axiosClient";

import type {
  MoneyDue,
} from "../types/moneyDueTypes";

class MoneyDueService {
  async getAll(): Promise<MoneyDue[]> {
    const response =
      await axiosClient.get("/MoneyDue");

    return response.data;
  }

  async getById(
    id: string
  ): Promise<MoneyDue> {
    const response =
      await axiosClient.get(
        `/MoneyDue/${id}`
      );

    return response.data;
  }

  async create(
    data: unknown
  ) {
    const response =
      await axiosClient.post(
        "/MoneyDue",
        data
      );

    return response.data;
  }

  async update(
    id: string,
    data: unknown
  ) {
    await axiosClient.put(
      `/MoneyDue/${id}`,
      data
    );
  }

  async recordSettlement(
    id: string,
    data: unknown
  ) {
    await axiosClient.post(
      `/MoneyDue/${id}/settlements`,
      data
    );
  }

  async updateSettlement(
    moneyDueId: string,
    settlementId: string,
    data: {
        amount: number;
        settlementDate: string;
        description?: string | null;
    }
    ) {
    const response = await axiosClient.put(
        `/MoneyDue/${moneyDueId}/settlements/${settlementId}`,
        data
    );

    return response.data;
    }

    async deleteSettlement(
    moneyDueId: string,
    settlementId: string
    ) {
    await axiosClient.delete(
        `/MoneyDue/${moneyDueId}/settlements/${settlementId}`
    );
    }

    async delete(
        id: string
    ) {
        await axiosClient.delete(
        `/MoneyDue/${id}`
        );
    }
}

export default new MoneyDueService();