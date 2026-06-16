export interface Income {
  id: string;
  userId: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface CreateIncomeRequest {
  amount: number;
  source: string;
  description: string;
  date: string;
}

export interface UpdateIncomeRequest {
  amount: number;
  source: string;
  description: string;
  date: string;
}