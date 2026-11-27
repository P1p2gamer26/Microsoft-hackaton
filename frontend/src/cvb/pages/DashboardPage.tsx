// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, Truck, Timer, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [countryIso2, setCountryIso2] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (countryIso2) qs.set('countryIso2', countryIso2);
    if (orderStatus) qs.set('orderStatus', orderStatus);
    api.get(`/dashboard?${qs.toString()}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/countries').then(setCountries).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [countryIso2, orderStatus]);

  if (loading || !data) return <div className="p-8 text-center text-slate-500">Cargando dashboard ejecutivo...</div>;

  const { commercial, logistics, time, inventory } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#173D32]">Dashboard Ejecutivo Internacional</h1>
            <ProvenanceBadge value="SIMULATED" />
          </div>
          <p className="text-xs text-slate-600 mt-0.5">{data.dataNotice}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select value={countryIso2} onChange={(e) => setCountryIso2(e.target.value)} className="cvb-input w-44">
            <option value="">Todos los mercados</option>
            {countries.filter((c) => c.iso2 !== 'CO').map((c) => (
              <option key={c.iso2} value={c.iso2}>{c.nameEs}</option>
            ))}
          </select>
          <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} className="cvb-input w-44">
            <option value="">Todos los estados</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="DOCUMENTATION">Documentación</option>
            <option value="IN_TRANSIT">En tránsito</option>
            <option value="DELIVERED">Entregado</option>
          </select>
        </div>
      </div>

      {/* 4 Domain KPI Sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="cvb-card p-4 border-l-4 border-l-[#173D32]">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>INDICADORES COMERCIALES</span>
            <Users className="w-4 h-4 text-[#173D32]" />
          </div>
          <div className="text-2xl font-bold text-[#173D32] mt-2">
            ${Number(commercial.totalSalesValueUsd || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">USD ventas</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-slate-600">
            <div>Compradores: <b>{commercial.totalBuyersRegistered}</b></div>
            <div>Contactados: <b>{commercial.contactedBuyers}</b></div>
            <div>Cotizaciones: <b>{commercial.quotesSent}</b></div>
            <div>Negociación: <b>{commercial.activeNegotiations}</b></div>
            <div>Ventas cerradas: <b>{commercial.closedSales}</b></div>
            <div>Conversión: <b>{commercial.conversionRatePct}%</b></div>
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-[#386B4D] font-medium">
            Pipeline total: ${Number(commercial.totalOpportunitiesValueUsd || 0).toLocaleString()} USD
          </div>
        </div>

        <div className="cvb-card p-4 border-l-4 border-l-[#386B4D]">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>INDICADORES LOGÍSTICOS</span>
            <Truck className="w-4 h-4 text-[#386B4D]" />
          </div>
          <div className="text-2xl font-bold text-[#173D32] mt-2">
            ${Number(logistics.avgLogisticsCostUsd || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">USD costo prom.</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-slate-600">
            <div>Pendientes: <b>{logistics.pendingOrders}</b></div>
            <div>Preparación: <b>{logistics.inPreparationOrders}</b></div>
            <div>Despachados: <b>{logistics.dispatchedOrders}</b></div>
            <div>En tránsito: <b>{logistics.inTransitOrders}</b></div>
            <div>Entregados: <b>{logistics.deliveredOrders}</b></div>
            <div>Entrega prom.: <b>{logistics.avgDeliveryDays} d</b></div>
          </div>
        </div>

        <div className="cvb-card p-4 border-l-4 border-l-[#4A3027]">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>TIME TO MARKET (TIEMPOS)</span>
            <Timer className="w-4 h-4 text-[#4A3027]" />
          </div>
          <div className="text-2xl font-bold text-[#4A3027] mt-2">
            {time.totalTimeToMarketDays} <span className="text-xs font-normal text-slate-500">días totales</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs text-slate-600">
            <div>Hallar comprador: <b>{time.avgTimeToFindBuyerDays} d</b></div>
            <div>Resp. comprador: <b>{time.avgBuyerResponseHours} h</b></div>
            <div>A cotización: <b>{time.avgTimeToQuoteDays} d</b></div>
            <div>Cotiz. a cierre: <b>{time.avgQuoteToCloseDays} d</b></div>
            <div>Preparación: <b>{time.avgPreparationDays} d</b></div>
            <div>Tránsito intl.: <b>{time.avgInternationalTransitDays} d</b></div>
          </div>
        </div>

        <div className="cvb-card p-4 border-l-4 border-l-amber-600">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>INVENTARIO CAFÉ TOSTADO</span>
            <Package className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-bold text-[#173D32] mt-2">
            {Number(inventory.availableKg || 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">kg disponibles</span>
          </div>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between"><span>Comprometido en pedidos:</span><b>{Number(inventory.committedKg || 0).toLocaleString()} kg</b></div>
            <div className="flex justify-between"><span>Pendiente de venta:</span><b>{Number(inventory.pendingSaleKg || 0).toLocaleString()} kg</b></div>
            <div className="flex justify-between"><span>Antigüedad promedio:</span><b>{inventory.avgInventoryAgeDays} días</b></div>
            <div className="flex justify-between text-amber-700 font-medium">
              <span className="flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Próx. límite comercial:</span>
              <b>{inventory.lotsNearCommercialLimit} lote(s)</b>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="cvb-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#173D32] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#386B4D]" /> Pipeline Comercial por Etapa
            </h2>
            <span className="text-xs text-slate-500">Oportunidades registradas</span>
          </div>
          {data.pipelineChart?.length ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pipelineChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Oportunidades" fill="#173D32" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">Sin oportunidades para el filtro seleccionado</div>
          )}
        </div>

        <div className="cvb-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#173D32] flex items-center gap-2">
              <Timer className="w-4 h-4 text-[#4A3027]" /> Desglose Time to Market (Días por Etapa)
            </h2>
            <span className="text-xs text-slate-500">Calculado desde time_events</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={(data.ttmStageChart || []).filter((s: any) => s.avgDays > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stageCode" tick={{ fontSize: 9 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgDays" name="Días promedio" fill="#386B4D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
