export interface NetWorthItem {
  id: string;
  name: string;
  amount: number;
  type: string;
}

export interface CreateNetWorthItemRequest {
  name: string;
  amount: number;
  type: string;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}   

export interface NetWorthTrendPoint {
  snapshotDate: string;
  netWorth: number;
}