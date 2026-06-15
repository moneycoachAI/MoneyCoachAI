import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:5279/api", //baseURL → your ASP.NET backend API
    headers:{
        "Content-Type": "application/json"
    },
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

export default axiosClient;