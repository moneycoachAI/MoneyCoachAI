export interface RecurringTransaction {
  id: string;

  title: string;

  amount: number;

  type: "Income" | "Expense";

  category: string;

  otherDescription?: string;

  description?: string;

  frequency: string;

  startDate: string;

  scheduleDay: number;

  nextOccurrenceDate: string;

  endDate?: string;

  reminderDaysBefore: number;

  reminderHour: number;

  lastCompletedOccurrenceDate?: string;

  reminderStatus: string;

  reminderMessage: string;

  daysUntilDue: number;

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}

export interface CreateRecurringTransactionRequest {
  title: string;

  amount: number;

  type: "Income" | "Expense";

  category: string;

  otherDescription?: string;

  description?: string;

  frequency: string;

  startDate: string;

  endDate?: string;
}