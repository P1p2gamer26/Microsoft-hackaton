// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, PlugZap } from 'lucide-react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [showUser, setShowUser] = useState(false);
  const [showCompany, setShowCompany] = useState(false);
  const [uForm, setUForm] = useState({ email: '', fullName: '', password: 'Demo2026!', roleCode: 'COMMERCIAL_ANALYST', companyId: '' });
  const [cForm, setCForm] = useState({ taxId: '', name: '', city: '', email: '', companyType: 'EXPORTER' });

  const load = () => api.get('/admin/overview').then(setData);
  useEffect(() => { load(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/admin/users', uForm);
    setShowUser(false);
    load();
  };

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/admin/companies', cForm);
    setShowCompany(false);
    load();
  };

  if (!data) return <div className="p-8 text-center text-slate-500">Cargando administración y seguridad...</div>;
  const isGeneralAdmin = user?.roleCode === 'GENERAL_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#386B4D]" /> Administración, Seguridad RBAC e Integraciones
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Control de acceso por 6 roles, aislamiento multi-empresa, conectores externos y bitácora de auditoría.
          </p>
        </div>
        {isGeneralAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowCompany(true)} className="cvb-btn-secondary"><Plus className="w-4 h-4" /> Nueva Empresa</button>
            <button onClick={() => setShowUser(true)} className="cvb-btn-primary"><Plus className="w-4 h-4" /> Nuevo Usuario</button>
          </div>
        )}
      </div>

      {/* External Connectors */}
      <div className="cvb-card p-5 space-y-3">
        <h2 className="font-semibold text-sm text-[#173D32] flex items-center gap-1.5">
          <PlugZap className="w-4 h-4 text-[#386B4D]" /> Conectores Externos y Variables de Entorno
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {(data.connectors || []).map((c: any) => (
            <div key={c.code} className="p-3 rounded-xl border bg-[#F4EFE5]/30">
              <div className="flex items-center justify-between">
                <b className="text-[#173D32]">{c.name}</b>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {c.configured ? 'CONECTADO' : 'MODO DEMO / CSV'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1">Vars: <code>{c.requiredEnvVars}</code></div>
            </div>
          ))}
        </div>
      </div>

      {/* Companies & Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="cvb-card p-4 overflow-x-auto">
          <h3 className="font-semibold text-sm text-[#173D32] mb-2">Empresas Registradas ({data.companies.length})</h3>
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr><th className="p-2 text-left">NIT</th><th className="p-2 text-left">Empresa</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Ciudad</th></tr>
            </thead>
            <tbody className="divide-y">
              {data.companies.map((c: any) => (
                <tr key={c.id}><td className="p-2">{c.taxId}</td><td className="p-2 font-semibold">{c.name}</td><td className="p-2">{c.companyType}</td><td className="p-2">{c.city}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cvb-card p-4 overflow-x-auto">
          <h3 className="font-semibold text-sm text-[#173D32] mb-2">Usuarios ({data.users.length})</h3>
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr><th className="p-2 text-left">Nombre</th><th className="p-2 text-left">Correo</th><th className="p-2 text-left">Rol</th></tr>
            </thead>
            <tbody className="divide-y">
              {data.users.map((u: any) => (
                <tr key={u.id}><td className="p-2 font-semibold">{u.fullName}</td><td className="p-2">{u.email}</td><td className="p-2">{u.role?.name}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="cvb-card p-4 overflow-x-auto">
        <h3 className="font-semibold text-sm text-[#173D32] mb-2">Bitácora de Auditoría Reciente</h3>
        <table className="w-full text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr><th className="p-2 text-left">Fecha</th><th className="p-2 text-left">Usuario</th><th className="p-2 text-left">Acción</th><th className="p-2 text-left">Entidad</th><th className="p-2 text-left">Detalle</th></tr>
          </thead>
          <tbody className="divide-y">
            {(data.auditLogs || []).slice(0, 15).map((a: any) => (
              <tr key={a.id}>
                <td className="p-2">{new Date(a.createdAt).toLocaleString('es-CO')}</td>
                <td className="p-2">{a.userEmail}</td>
                <td className="p-2 font-semibold text-[#173D32]">{a.action}</td>
                <td className="p-2">{a.entityName} #{a.entityId}</td>
                <td className="p-2 text-slate-600">{a.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showUser} onClose={() => setShowUser(false)} title="Crear Usuario">
        <form onSubmit={createUser} className="space-y-3 text-xs">
          <div><label>Nombre completo</label><input required className="cvb-input mt-1" value={uForm.fullName} onChange={(e) => setUForm({ ...uForm, fullName: e.target.value })} /></div>
          <div><label>Correo</label><input type="email" required className="cvb-input mt-1" value={uForm.email} onChange={(e) => setUForm({ ...uForm, email: e.target.value })} /></div>
          <div>
            <label>Rol</label>
            <select className="cvb-input mt-1" value={uForm.roleCode} onChange={(e) => setUForm({ ...uForm, roleCode: e.target.value })}>
              {data.roles.map((r: any) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label>Empresa</label>
            <select required className="cvb-input mt-1" value={uForm.companyId} onChange={(e) => setUForm({ ...uForm, companyId: e.target.value })}>
              <option value="">Seleccione empresa...</option>
              {data.companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Crear Usuario</button>
        </form>
      </Modal>

      <Modal open={showCompany} onClose={() => setShowCompany(false)} title="Registrar Empresa Exportadora">
        <form onSubmit={createCompany} className="space-y-3 text-xs">
          <div><label>NIT</label><input required className="cvb-input mt-1" value={cForm.taxId} onChange={(e) => setCForm({ ...cForm, taxId: e.target.value })} /></div>
          <div><label>Nombre comercial</label><input required className="cvb-input mt-1" value={cForm.name} onChange={(e) => setCForm({ ...cForm, name: e.target.value })} /></div>
          <div><label>Ciudad</label><input className="cvb-input mt-1" value={cForm.city} onChange={(e) => setCForm({ ...cForm, city: e.target.value })} /></div>
          <div><label>Correo</label><input type="email" className="cvb-input mt-1" value={cForm.email} onChange={(e) => setCForm({ ...cForm, email: e.target.value })} /></div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Registrar Empresa</button>
        </form>
      </Modal>
    </div>
  );
};
