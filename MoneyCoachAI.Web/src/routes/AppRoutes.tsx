
import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectRoute from "./ProtectedRoute";


const LoginPage = lazy(
  () => import("../pages/LoginPage")
);

const RegisterPage = lazy(
  () => import("../pages/RegisterPage")
);

const DashboardPage = lazy(
  () => import("../pages/DashboardPage")
);

const ExpensesPage = lazy(
  () => import("../pages/ExpensesPage")
);

const BudgetsPage = lazy(
  () => import("../pages/BudgetsPage")
);

const ReportsPage = lazy(
  () => import("../pages/ReportsPage")
);

const SuggestionsPage = lazy(
  () => import("../pages/SuggestionsPage")
);

const AIAdvisorPage = lazy(
  () => import("../pages/AIAdvisorPage")
);

const IncomesPage = lazy(
  () => import("../pages/IncomesPage")
);

const FinancialGoalsPage = lazy(
  () => import("../pages/FinancialGoalsPage")
);

const NetWorthPage = lazy(
  () => import("../pages/NetWorthPage")
);

const RecurringTransactionsPage = lazy(
  () => import("../pages/RecurringTransactionsPage")
);

const InvestmentsPage = lazy(
  () => import("../pages/InvestmentsPage")
);

const NotificationsPage = lazy(
  () => import("../pages/NotificationsPage")
);

const SettingsPage = lazy(
  () => import("../pages/SettingsPage")
);

const ProfilePage = lazy(
  () => import("../pages/ProfilePage")
);

const ForgotPasswordPage = lazy(
  () => import("../pages/ForgotPasswordPage")
);

const ResetPasswordPage = lazy(
  () => import("../pages/ResetPasswordPage")
);

const MoneyDuePage = lazy(
  () => import("../pages/MoneyDuePage")
);

function AppRoutes() {
    return(
        <BrowserRouter>
                <Suspense
            fallback={
            <div className="route-loading-screen">
                <div className="route-loading-spinner" />

                <p>Loading MoneyCoachAI...</p>
            </div>
            }
        >
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

                 <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
                />
                    
                <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
                />

                <Route path="/money-due" element={
                    <ProtectRoute>
                        <MoneyDuePage></MoneyDuePage>
                    </ProtectRoute>
                }/>
                                
            </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default AppRoutes;