import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:5279/api", //baseURL → your ASP.NET backend API
    headers:{
        "Content-Type": "application/json"
    },
});

export default axiosClient;