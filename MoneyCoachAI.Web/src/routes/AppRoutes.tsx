import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProtectRoute from "./ProtectedRoute";
import DashboardPage from "../pages/DashboardPage";
import ExpensesPage from "../pages/ExpensesPage";
import BudgetsPage from "../pages/BudgetsPage";
import ReportsPage from "../pages/ReportsPage";
import SuggestionsPage from "../pages/SuggestionsPage";
import AIAdvisorPage from "../pages/AIAdvisorPage";
import IncomesPage from "../pages/IncomesPage";
import FinancialGoalsPage from "../pages/FinancialGoalsPage";   
import NetWorthPage from "../pages/NetWorthPage";
import RecurringTransactionsPage from "../pages/RecurringTransactionsPage";
import InvestmentsPage from "../pages/InvestmentsPage";
import NotificationsPage from "../pages/NotificationsPage";
import SettingsPage from "../pages/SettingsPage";
import ProfilePage from "../pages/ProfilePage";

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

                <Route path="/budgets" element={
                    <ProtectRoute>
                        <BudgetsPage />
                    </ProtectRoute>
                } />

                <Route path="/reports" element={
                    <ProtectRoute>
                        <ReportsPage />
                    </ProtectRoute>
                } />

                <Route path="/suggestions" element={
                    <ProtectRoute>
                        <SuggestionsPage />
                    </ProtectRoute>
                } />

                <Route path="/ai-advisor" element={
                    <ProtectRoute>
                        <AIAdvisorPage />
                    </ProtectRoute>
                } />
                
                <Route path="/incomes" element={
                    <ProtectRoute>
                        <IncomesPage></IncomesPage>
                    </ProtectRoute>
                } />

                <Route path="/financialGoals" element={
                    <ProtectRoute>
                        <FinancialGoalsPage></FinancialGoalsPage>
                    </ProtectRoute>
                }/>
                <Route path= "/net-worth" element={
                    <ProtectRoute>
                        <NetWorthPage></NetWorthPage>
                    </ProtectRoute>
                }/>
                <Route path="/recurring" element={
                    <ProtectRoute>
                        <RecurringTransactionsPage></RecurringTransactionsPage>
                    </ProtectRoute>
                } />
                <Route path="/investments" element={
                    <ProtectRoute>
                        <InvestmentsPage></InvestmentsPage>
                    </ProtectRoute>
                } />
                <Route path="/notifications" element={
                    <ProtectRoute>
                        <NotificationsPage></NotificationsPage>
                    </ProtectRoute>}
                 />
                 <Route path="/settings" element={
                    <ProtectRoute>
                        <SettingsPage></SettingsPage>
                    </ProtectRoute>
                 }
                  />
                  <Route path="/profile" element={
                    <ProtectRoute>
                        <ProfilePage></ProfilePage>
                    </ProtectRoute>
                  } />
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;