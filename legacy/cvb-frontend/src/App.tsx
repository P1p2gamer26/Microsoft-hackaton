import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MarketRadarPage } from './pages/MarketRadarPage';
import { BuyerFinderPage } from './pages/BuyerFinderPage';
import { CrmPage } from './pages/CrmPage';
import { InventoryPage } from './pages/InventoryPage';
import { GreenVsRoastedPage } from './pages/GreenVsRoastedPage';
import { GisLogisticsPage } from './pages/GisLogisticsPage';
import { ExportCopilotPage } from './pages/ExportCopilotPage';
import { OrdersPage } from './pages/OrdersPage';
import { TimeToMarketPage } from './pages/TimeToMarketPage';
import { FinancePage } from './pages/FinancePage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="markets" element={<MarketRadarPage />} />
        <Route path="buyers" element={<BuyerFinderPage />} />
        <Route path="crm" element={<CrmPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="comparator" element={<GreenVsRoastedPage />} />
        <Route path="gis" element={<GisLogisticsPage />} />
        <Route path="copilot" element={<ExportCopilotPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="ttm" element={<TimeToMarketPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
