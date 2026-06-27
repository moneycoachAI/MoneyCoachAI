export interface Investment {
  id: string;
  name: string;
  type: string;
  investedAmount: number;
  currentValue: number;
  profitOrLoss: number;
  profitOrLossPercentage: number;
  investmentDate: string;
}

export interface CreateInvestmentRequest {
  name: string;
  type: string;
  investedAmount: number;
  currentValue: number;
  investmentDate: string;
}

export interface InvestmentSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitOrLoss: number;
  profitOrLossPercentage: number;
}

export interface InvestmentAllocation {
  type: string;
  amount: number;
}