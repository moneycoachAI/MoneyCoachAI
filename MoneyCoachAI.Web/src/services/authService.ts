import axiosClient from "../api/axiosClient";

import type{
    LoginRequest,
    RegisterRequest,
    AuthResponse
} from "../types/authTypes";

export const registerUser = async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>("/Auth/register", data);
    
    return response.data;
};

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>("/Auth/login", data);
   
    return response.data;
};

