import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { DollarSign, RefreshCw, Plus } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { Modal } from '../components/Modal';

export const FinancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [groupTab, setGroupTab] = useState<'byOperation' | 'byBuyer' | 'byMarket' | 'byProduct'>('byOperation');
  const [usdAmount, setUsdAmount] = useState(10000);
  const [targetCur, setTargetCur] = useState('COP');
  const [showFx, setShowFx] = useState(false);
  const [fxForm, setFxForm] = useState({ targetCurrency: 'COP', rate: 4180, rateDate: new Date().toISOString().slice(0, 10), sourceName: 'TRM Banco de la República Colombia' });

  const load = () => api.get('/finance').then(setData);
  useEffect(() => { load(); }, []);

  const addFx = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/finance/exchange-rates', { ...fxForm, baseCurrency: 'USD', dataProvenance: 'USER_INPUT' });
    setShowFx(false);
    load();
  };

  if (!data) return <div className="p-8 text-center text-slate-500">Cargando inteligencia financiera...</div>;

  const s = data.summary;
  const activeFx = (data.exchangeRates || []).find((r: any) => r.targetCurrency === targetCur);
  const converted = activeFx ? usdAmount * Number(activeFx.rate) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-[#386B4D]" /> Inteligencia Financiera y Rentabilidad
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Análisis de ingresos, costos, márgenes por comprador/mercado/producto, sensibilidad y conversión con tasas registradas y fechadas.
          </p>
        </div>
        <button onClick={() => setShowFx(true)} className="cvb-btn-primary"><Plus className="w-4 h-4" /> Registrar Tasa FX</button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Ingresos Totales</div><div className="text-xl font-bold text-[#173D32]">${Number(s.revenueUsd).toLocaleString()}</div></div>
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Costos Producto + Transf.</div><div className="text-xl font-bold">${(Number(s.productCostUsd) + Number(s.transformationCostUsd)).toLocaleString()}</div></div>
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Logística + Exp. + Fin.</div><div className="text-xl font-bold text-[#4A3027]">${(Number(s.logisticsCostUsd) + Number(s.exportExpensesUsd) + Number(s.financialCostUsd) + Number(s.commissionCostUsd)).toLocaleString()}</div></div>
        <div className="cvb-card p-4"><div className="text-xs text-slate-500">Margen Bruto</div><div className="text-xl font-bold text-[#386B4D]">${Number(s.grossMarginUsd).toLocaleString()}</div></div>
        <div className="cvb-card p-4 bg-[#173D32] text-white"><div className="text-xs opacity-80">Margen Operativo Est.</div><div className="text-xl font-bold">${Number(s.operatingMarginUsd).toLocaleString()} ({s.operatingMarginPct}%)</div></div>
      </div>

      {/* Profitability Breakdown */}
      <div className="cvb-card p-5 space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            ['byOperation', 'Por Operación'],
            ['byBuyer', 'Por Comprador'],
            ['byMarket', 'Por Mercado'],
            ['byProduct', 'Por Producto'],
          ].map(([k, label]) => (
            <button key={k} onClick={() => setGroupTab(k as any)} className={`px-3.5 py-1.5 rounded-lg font-medium ${groupTab === k ? 'bg-[#173D32] text-white' : 'bg-[#F4EFE5] text-[#173D32]'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr>
                <th className="p-2.5 text-left">{groupTab === 'byOperation' ? 'Pedido / Comprador' : 'Segmento'}</th>
                <th className="p-2.5 text-right">Ingresos (USD)</th>
                <th className="p-2.5 text-right">Margen Operativo (USD)</th>
                <th className="p-2.5 text-right">Rentabilidad (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data[groupTab] || []).map((row: any, i: number) => (
                <tr key={i} className="hover:bg-[#F4EFE5]/40">
                  <td className="p-2.5 font-semibold text-[#173D32]">
                    {groupTab === 'byOperation' ? `${row.orderNumber} — ${row.buyerName} (${row.market})` : row.name}
                  </td>
                  <td className="p-2.5 text-right">${Number(row.revenueUsd).toLocaleString()}</td>
                  <td className="p-2.5 text-right font-bold text-[#386B4D]">${Number(row.operatingMarginUsd).toLocaleString()}</td>
                  <td className="p-2.5 text-right font-semibold">{row.operatingMarginPct ?? row.marginPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sensitivity & Dated FX Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="cvb-card p-5">
          <h3 className="font-semibold text-sm text-[#173D32] mb-2">Análisis de Sensibilidad (Margen Operativo USD)</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.sensitivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="variationPct" tickFormatter={(v) => `${v}%`} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="operatingMarginIfPriceChangesUsd" name="Variación Precio Venta" stroke="#173D32" strokeWidth={2.5} />
                <Line type="monotone" dataKey="operatingMarginIfLogisticsChangesUsd" name="Variación Costo Logístico" stroke="#d97706" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cvb-card p-5 space-y-3 text-xs">
          <h3 className="font-semibold text-sm text-[#173D32] flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-[#386B4D]" /> Conversor Multi-Divisa con Tasas Fechadas y Trazables
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label>Monto en USD</label><input type="number" className="cvb-input mt-1" value={usdAmount} onChange={(e) => setUsdAmount(Number(e.target.value))} /></div>
            <div>
              <label>Divisa destino</label>
              <select className="cvb-input mt-1" value={targetCur} onChange={(e) => setTargetCur(e.target.value)}>
                {(data.exchangeRates || []).map((r: any) => <option key={r.id} value={r.targetCurrency}>{r.targetCurrency} ({r.rate} • {r.rateDate})</option>)}
              </select>
            </div>
          </div>
          {activeFx && (
            <div className="p-3 rounded-xl bg-[#F4EFE5] space-y-1">
              <div className="text-lg font-bold text-[#173D32]">{converted.toLocaleString('es-CO', { maximumFractionDigits: 2 })} {targetCur}</div>
              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span>Tasa: 1 USD = {activeFx.rate} {targetCur} ({activeFx.rateDate})</span>
                <ProvenanceBadge value={activeFx.dataProvenance} />
              </div>
              <div className="text-[10px] text-slate-500">Fuente: {activeFx.sourceName}</div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showFx} onClose={() => setShowFx(false)} title="Registrar Tasa de Cambio Fechada">
        <form onSubmit={addFx} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label>Moneda destino (ej. COP, EUR)</label><input required maxLength={3} className="cvb-input mt-1" value={fxForm.targetCurrency} onChange={(e) => setFxForm({ ...fxForm, targetCurrency: e.target.value.toUpperCase() })} /></div>
            <div><label>Tasa (por 1 USD)</label><input type="number" step="any" required className="cvb-input mt-1" value={fxForm.rate} onChange={(e) => setFxForm({ ...fxForm, rate: Number(e.target.value) })} /></div>
          </div>
          <div><label>Fecha tasa</label><input type="date" required className="cvb-input mt-1" value={fxForm.rateDate} onChange={(e) => setFxForm({ ...fxForm, rateDate: e.target.value })} /></div>
          <div><label>Fuente oficial / referencia (obligatorio)</label><input required className="cvb-input mt-1" value={fxForm.sourceName} onChange={(e) => setFxForm({ ...fxForm, sourceName: e.target.value })} /></div>
          <button type="submit" className="cvb-btn-primary w-full justify-center">Guardar Tasa</button>
        </form>
      </Modal>
    </div>
  );
};
