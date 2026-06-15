import axiosClient from "../api/axiosClient";

import type {
    CreateExpenseRequest,
    Expense,
}from "../types/expenseTypes";


export const getExpenses = async () : Promise<Expense[]> => {
    const response = await axiosClient.get<Expense[]>("/Expenses");

    return response.data;
};

export const createExpense = async (data: CreateExpenseRequest
):Promise<string> => {
    const response = await axiosClient.post<string>("/Expenses", data);

    return response.data;
};

export const deleteExpense = async (id: string): Promise<string> =>{
    const response = await axiosClient.delete<string>(`/Expenses/${id}`);
    return response.data;
};