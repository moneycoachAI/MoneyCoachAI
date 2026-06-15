export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
  createdAt: string;
}

export interface CreateBudgetRequest {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}

export interface UpdateBudgetRequest {
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}