// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('exportador@cordillera-demo.co');
  const [password, setPassword] = useState('Demo2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/auth/demo-accounts').then(setDemoAccounts).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/cvb/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#173D32] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left brand panel */}
        <div className="bg-gradient-to-br from-[#173D32] via-[#235241] to-[#4A3027] p-8 text-white flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2.5 bg-white/10 px-3 py-1.5 rounded-full text-xs mb-6">
              <Coffee className="w-4 h-4 text-[#F4EFE5]" />
              <span>ASOEXPORT • Plataforma Empresarial SaaS</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">COFFEE VALUE BRIDGE</h1>
            <p className="mt-3 text-sm text-[#F4EFE5]/85 leading-relaxed">
              Plataforma integral de inteligencia comercial, geoespacial (GIS) y logística para acelerar la
              comercialización internacional del café tostado colombiano y optimizar el Time to Market.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 rounded-xl p-3">
                <div className="font-semibold">13 Módulos Conectados</div>
                <div className="text-white/75 mt-1">Mercados, Compradores, CRM, GIS, Copilot y Finanzas</div>
              </div>
              <div className="bg-white/10 rounded-xl p-3">
                <div className="font-semibold">RBAC + Aislamiento</div>
                <div className="text-white/75 mt-1">6 roles empresariales y separación estricta por empresa</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-white/15 text-xs text-white/75 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Datos de demostración claramente marcados como SIMULADO / ESTIMADO.</span>
          </div>
        </div>

        {/* Right login + demo accounts */}
        <div className="p-8 bg-[#F4EFE5]/40">
          <h2 className="text-xl font-bold text-[#173D32]">Acceso a la Plataforma</h2>
          <p className="text-xs text-slate-600 mt-1">Ingrese con sus credenciales corporativas o seleccione un perfil DEMO.</p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700">Correo electrónico</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cvb-input pl-9"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Contraseña</label>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cvb-input pl-9"
                />
              </div>
            </div>

            {error && <div className="text-xs bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">{error}</div>}

            <button type="submit" disabled={loading} className="cvb-btn-primary w-full justify-center py-2.5">
              {loading ? 'Autenticando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {demoAccounts.length > 0 && (
            <div className="mt-6">
              <div className="text-xs font-semibold text-[#4A3027] mb-2">
                Cuentas de Demostración (Clave: <code className="bg-white px-1.5 py-0.5 rounded">Demo2026!</code>)
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition ${
                      email === acc.email
                        ? 'bg-[#173D32] text-white border-[#173D32]'
                        : 'bg-white hover:bg-[#F4EFE5] border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold flex justify-between">
                      <span>{acc.role}</span>
                      <span className="opacity-75">{acc.email}</span>
                    </div>
                    <div className="text-[11px] opacity-80">{acc.company}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
