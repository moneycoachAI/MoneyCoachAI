export interface AIAdviceRequest {
  month: number;
  year: number;
  question: string;
}

export interface AIAdviceResponse {
  advice: string;
}