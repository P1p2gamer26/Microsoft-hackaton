// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Globe2, Users, KanbanSquare, Package, Scale, MapPin,
  Bot, Truck, Timer, DollarSign, FileSpreadsheet, ShieldCheck, Search,
  Bell, LogOut, Menu, X, Coffee, Languages
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const Layout: React.FC = () => {
  const { user, logout, lang, setLang, t, can } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<any>(null);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const navItems = [
    { to: '/cvb/', key: 'dashboard', icon: LayoutDashboard, perm: 'DASHBOARD_VIEW' },
    { to: '/cvb/markets', key: 'markets', icon: Globe2, perm: 'MARKETS_VIEW' },
    { to: '/cvb/buyers', key: 'buyers', icon: Users, perm: 'BUYERS_VIEW' },
    { to: '/cvb/crm', key: 'crm', icon: KanbanSquare, perm: 'CRM_VIEW' },
    { to: '/cvb/inventory', key: 'inventory', icon: Package, perm: 'INVENTORY_VIEW' },
    { to: '/cvb/comparator', key: 'comparator', icon: Scale, perm: 'COMPARATOR_USE' },
    { to: '/cvb/gis', key: 'gis', icon: MapPin, perm: 'LOGISTICS_VIEW' },
    { to: '/cvb/copilot', key: 'copilot', icon: Bot, perm: 'COMPLIANCE_VIEW' },
    { to: '/cvb/orders', key: 'orders', icon: Truck, perm: 'ORDERS_VIEW' },
    { to: '/cvb/ttm', key: 'ttm', icon: Timer, perm: 'TTM_VIEW' },
    { to: '/cvb/finance', key: 'finance', icon: DollarSign, perm: 'FINANCE_VIEW' },
    { to: '/cvb/reports', key: 'reports', icon: FileSpreadsheet, perm: 'DASHBOARD_VIEW' },
    { to: '/cvb/admin', key: 'admin', icon: ShieldCheck, perm: 'ADMIN_MANAGE', allowExporterAdmin: true },
  ];

  useEffect(() => {
    api.get('/notifications').then(setNotifs).catch(() => {});
  }, []);

  useEffect(() => {
    if (searchQ.trim().length < 2) { setSearchRes(null); return; }
    const id = setTimeout(() => {
      api.get(`/search?q=${encodeURIComponent(searchQ)}`).then(setSearchRes).catch(() => {});
    }, 250);
    return () => clearTimeout(id);
  }, [searchQ]);

  const unread = notifs.filter((n) => !n.read).length;

  const markRead = async (id: number) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  return (
    <div className="min-h-screen flex bg-[#F4EFE5]">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#173D32] text-white flex flex-col transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#386B4D] flex items-center justify-center shadow">
              <Coffee className="w-5 h-5 text-[#F4EFE5]" />
            </div>
            <div>
              <div className="font-bold tracking-tight text-sm leading-tight">COFFEE VALUE BRIDGE</div>
              <div className="text-[10px] text-[#F4EFE5]/70">ASOEXPORT B2B SaaS</div>
            </div>
          </div>
          <button className="lg:hidden text-white/80" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems
            .filter((i) => can(i.perm) || (i.allowExporterAdmin && user?.roleCode === 'EXPORTER_ADMIN'))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-[#386B4D] text-white shadow-sm' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t(item.key)}</span>
                </NavLink>
              );
            })}
        </nav>

        <div className="p-3 border-t border-white/10 bg-[#123027]">
          <div className="text-xs font-semibold truncate">{user?.fullName}</div>
          <div className="text-[11px] text-[#F4EFE5]/70 truncate">{user?.roleName}</div>
          <div className="text-[10px] text-emerald-300 truncate mt-0.5">{user?.companyName}</div>
          <button
            onClick={() => { logout(); navigate('/cvb/login'); }}
            className="mt-2.5 w-full flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            <LogOut className="w-3.5 h-3.5" /> {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Demo transparency banner */}
        <div className="bg-[#4A3027] text-[#F4EFE5] text-xs px-4 py-1.5 flex items-center justify-between gap-2">
          <span>{t('demoBanner')}</span>
          <span className="hidden sm:inline text-[11px] opacity-80">HS 090121 / 090122 • PostGIS Ready</span>
        </div>

        {/* Topbar */}
        <header className="bg-white border-b border-[#173D32]/10 px-4 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 max-w-xl relative">
            <button className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-[#173D32]" />
            </button>
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-[#F4EFE5]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#386B4D]/30"
              />
              {searchRes && (
                <div className="absolute left-0 right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-2">
                  {['products', 'buyers', 'orders'].map((cat) =>
                    searchRes[cat]?.length > 0 ? (
                      <div key={cat}>
                        <div className="font-semibold uppercase text-[10px] text-slate-400 mb-1">{cat}</div>
                        {searchRes[cat].map((item: any) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setSearchQ(''); setSearchRes(null);
                              navigate(cat === 'products' ? '/cvb/inventory' : cat === 'buyers' ? '/cvb/buyers' : '/cvb/orders');
                            }}
                            className="w-full text-left px-2 py-1 hover:bg-[#F4EFE5] rounded flex justify-between"
                          >
                            <span className="font-medium text-[#173D32]">{item.label}</span>
                            <span className="text-slate-500">{item.sub}</span>
                          </button>
                        ))}
                      </div>
                    ) : null
                  )}
                  {!searchRes.products?.length && !searchRes.buyers?.length && !searchRes.orders?.length && (
                    <div className="text-slate-400">Sin resultados para "{searchQ}"</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-[#173D32] hover:bg-[#F4EFE5] flex items-center gap-1"
              title="Cambiar idioma ES/EN"
            >
              <Languages className="w-3.5 h-3.5" /> {lang.toUpperCase()}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-lg border border-slate-200 hover:bg-[#F4EFE5] relative"
              >
                <Bell className="w-4 h-4 text-[#173D32]" />
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 space-y-2 max-h-96 overflow-y-auto">
                  <div className="font-semibold text-xs text-[#173D32] border-b pb-2">Alertas Operativas ({unread} sin leer)</div>
                  {notifs.length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">Sin alertas registradas</div>
                  ) : (
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        className={`p-2.5 rounded-lg text-xs cursor-pointer border ${
                          n.read ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-amber-50/70 border-amber-200'
                        }`}
                      >
                        <div className="font-semibold text-[#173D32]">{n.title}</div>
                        <div className="text-slate-600 mt-0.5">{n.message}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
