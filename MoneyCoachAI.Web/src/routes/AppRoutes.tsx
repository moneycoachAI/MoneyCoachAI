import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectRoute from "./ProtectedRoute";
import DashboardPage from "../pages/DashboardPage";
import ExpensesPage from "../pages/ExpensesPage";

function AppRoutes() {
    return(
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                <Route path="/dashboard" element={
                    <ProtectRoute>
                        <DashboardPage />
                    </ProtectRoute>
                } />

                <Route path="/expenses" element={
                    <ProtectRoute>
                        <ExpensesPage />
                    </ProtectRoute>
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;