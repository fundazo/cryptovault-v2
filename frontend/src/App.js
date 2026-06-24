import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Spinner } from './components/ui';
import DashboardLayout from './components/dashboard/DashboardLayout';


import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/auth/PasswordPages';

import DashboardPage from './pages/dashboard/DashboardPage';
import PortfolioPage from './pages/dashboard/PortfolioPage';
import DepositPage from './pages/dashboard/DepositPage';
import WithdrawPage from './pages/dashboard/WithdrawPage';
import TransactionsPage from './pages/dashboard/TransactionsPage';
import ProfilePage from './pages/dashboard/ProfilePage';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import { AdminDepositsPage, AdminWithdrawalsPage } from './pages/admin/AdminTransactionPages';
import { AdminWalletsPage, AdminAllTransactionsPage } from './pages/admin/AdminWalletsPage';

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#080b14' }}>
    <Spinner size="lg"/>
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading/>;
  if (!user) return <Navigate to="/login" replace/>;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace/>;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading/>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace/>;
  return children;
};

const W = ({ children }) => <DashboardLayout>{children}</DashboardLayout>;

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#111827', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', fontSize: '14px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          duration: 4000,
        }}/>

        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>}/>
          <Route path="/register" element={<PublicRoute><RegisterPage/></PublicRoute>}/>
          <Route path="/verify-email" element={<VerifyEmailPage/>}/>
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage/></PublicRoute>}/>
          <Route path="/reset-password" element={<ResetPasswordPage/>}/>

          {/* User */}
          <Route path="/dashboard" element={<PrivateRoute><W><DashboardPage/></W></PrivateRoute>}/>
          <Route path="/dashboard/portfolio" element={<PrivateRoute><W><PortfolioPage/></W></PrivateRoute>}/>
          <Route path="/dashboard/deposit" element={<PrivateRoute><W><DepositPage/></W></PrivateRoute>}/>
          <Route path="/dashboard/withdraw" element={<PrivateRoute><W><WithdrawPage/></W></PrivateRoute>}/>
          <Route path="/dashboard/transactions" element={<PrivateRoute><W><TransactionsPage/></W></PrivateRoute>}/>
          <Route path="/dashboard/profile" element={<PrivateRoute><W><ProfilePage/></W></PrivateRoute>}/>

          {/* Admin */}
          <Route path="/admin" element={<AdminRoute><W><AdminDashboard/></W></AdminRoute>}/>
          <Route path="/admin/users" element={<AdminRoute><W><AdminUsersPage/></W></AdminRoute>}/>
          <Route path="/admin/deposits" element={<AdminRoute><W><AdminDepositsPage/></W></AdminRoute>}/>
          <Route path="/admin/withdrawals" element={<AdminRoute><W><AdminWithdrawalsPage/></W></AdminRoute>}/>
          <Route path="/admin/transactions" element={<AdminRoute><W><AdminAllTransactionsPage/></W></AdminRoute>}/>
          <Route path="/admin/wallets" element={<AdminRoute><W><AdminWalletsPage/></W></AdminRoute>}/>
          <Route path="/change-password" element={<ChangePasswordPage />} />

          <Route path="/" element={<Navigate to="/login" replace/>}/>
          <Route path="*" element={<Navigate to="/login" replace/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
