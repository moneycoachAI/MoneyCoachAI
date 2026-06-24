export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: string;
  frequency: string;
  startDate: string;
  isActive: boolean;
}

export interface CreateRecurringTransactionRequest {
  title: string;
  amount: number;
  category: string;
  type: string;
  frequency: string;
  startDate: string;
}