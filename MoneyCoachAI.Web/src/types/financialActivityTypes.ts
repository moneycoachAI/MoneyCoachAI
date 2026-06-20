export interface financialActivity {
  id: string;
  type: "Income" | "Expense";
  amount: number;
  categoryOrSource: string;
  description: string;
  date: string;
}