export type MoneyDueType =
  | "Receivable"
  | "Payable";

export type MoneyDueStatus =
  | "Pending"
  | "PartiallyPaid"
  | "Completed"
  | "Cancelled";

export type InterestPeriod =
  | "Day"
  | "Week"
  | "Month";

export interface MoneyDueSettlement {
  id: string;
  amount: number;
  settlementDate: string;
  description?: string;
  createdAt: string;
}

export interface MoneyDue {
  id: string;

  dueType: MoneyDueType;

  title: string;

  partyName: string;

  category: string;

  otherDescription?: string;

  hasInterest: boolean;

  principalAmount: number;

  interestRate: number;

  interestPeriod?: InterestPeriod;

  interestPeriods: number;

  interestMethod: "Simple";

  interestAmount: number;

  totalAmount: number;

  settledAmount: number;

  remainingAmount: number;

  dueDate: string;

  reminderDaysBefore: number;

  description?: string;

  status: MoneyDueStatus;

  isOverdue: boolean;

  createdAt: string;

  completedAt?: string;

  settlements: MoneyDueSettlement[];
}