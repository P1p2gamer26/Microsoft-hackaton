// Módulo comercial de Coffee Value Bridge integrado en CaféTrace.
// Se monta en /cvb/* dentro del HashRouter principal.
import type { ReactNode } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { MarketRadarPage } from './pages/MarketRadarPage'
import { BuyerFinderPage } from './pages/BuyerFinderPage'
import { CrmPage } from './pages/CrmPage'
import { InventoryPage } from './pages/InventoryPage'
import { GreenVsRoastedPage } from './pages/GreenVsRoastedPage'
import { GisLogisticsPage } from './pages/GisLogisticsPage'
import { ExportCopilotPage } from './pages/ExportCopilotPage'
import { OrdersPage } from './pages/OrdersPage'
import { TimeToMarketPage } from './pages/TimeToMarketPage'
import { FinancePage } from './pages/FinancePage'
import { ReportsPage } from './pages/ReportsPage'
import { AdminPage } from './pages/AdminPage'
import './index.css'

function Protegido({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (!token) return <LoginPage />
  return <>{children}</>
}

function NoEncontrado() {
  return (
    <div className="cvb-root grid place-items-center min-h-screen gap-3">
      <p>Página no encontrada en el módulo comercial.</p>
      <Link className="cvb-btn-primary" to="/cvb/">Ir al dashboard</Link>
    </div>
  )
}

export default function CvbApp() {
  return (
    <div className="cvb-root">
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<Protegido><Layout /></Protegido>}>
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
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </AuthProvider>
    </div>
  )
}
