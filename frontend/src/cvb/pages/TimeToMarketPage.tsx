// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Timer, AlertTriangle, Lightbulb, Target, TrendingDown } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

export const TimeToMarketPage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/ttm').then(setData);
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-500">Calculando inteligencia Time to Market...</div>;

  const { kpis, bottleneck, prediction } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
              <Timer className="w-6 h-6 text-[#4A3027]" /> Time to Market Intelligence
            </h1>
            <ProvenanceBadge value={data.dataProvenance} />
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Tiempo total desde que el café tostado está disponible hasta la entrega internacional. Calculado desde {data.totalEventsRecorded} eventos registrados en <code>time_events</code>.
          </p>
        </div>
      </div>

      {/* 8 Core TTM KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Time to First Buyer', `${kpis.timeToFirstBuyerDays} d`],
          ['Time to First Contact', `${kpis.timeToFirstContactDays} d`],
          ['Time to Quote', `${kpis.timeToQuoteDays} d`],
          ['Time to Order', `${kpis.timeToOrderDays} d`],
          ['Time to Dispatch', `${kpis.timeToDispatchDays} d`],
          ['Time in Transit', `${kpis.timeInTransitDays} d`],
          ['Time to Delivery', `${kpis.timeToDeliveryDays} d`],
          ['TOTAL TIME TO MARKET', `${kpis.totalTimeToMarketDays} d`, true],
        ].map(([label, val, accent]: any) => (
          <div key={label} className={`cvb-card p-4 ${accent ? 'bg-[#173D32] text-white' : ''}`}>
            <div className={`text-[11px] font-medium ${accent ? 'text-[#F4EFE5]/80' : 'text-slate-500'}`}>{label}</div>
            <div className="text-2xl font-bold mt-1">{val}</div>
          </div>
        ))}
      </div>

      {/* Bottleneck + Prediction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="cvb-card p-5 border-l-4 border-l-red-600">
          <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> A. Cuello de Botella Principal Detectado
          </div>
          <div className="text-xl font-bold text-[#173D32] mt-2">{bottleneck.stage}</div>
          <div className="text-sm text-slate-600 mt-1">
            Demora promedio registrada: <b>{bottleneck.avgDays} días</b> en esta etapa.
          </div>
        </div>

        <div className="cvb-card p-5 border-l-4 border-l-[#386B4D]">
          <div className="text-xs font-bold text-[#386B4D] flex items-center gap-1.5">
            <Target className="w-4 h-4" /> D. Predicción de Tiempos (Basada en Línea Base Histórica)
          </div>
          <div className="text-xl font-bold text-[#173D32] mt-2">
            {prediction.estimatedOperationDays} días estimados <span className="text-xs font-normal text-slate-500">(n={prediction.sampleOperations} operaciones)</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">{prediction.methodologyNote}</div>
        </div>
      </div>

      {/* 13-Stage Breakdown Chart */}
      <div className="cvb-card p-5">
        <h2 className="font-semibold text-sm text-[#173D32] mb-3">Desglose por Etapa del Ciclo de Comercialización (Días Promedio)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.stageBreakdown.filter((s: any) => s.stageCode !== 'PRODUCT_AVAILABLE')}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="stageCode" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgDays" name="Días promedio" fill="#4A3027" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations, Alerts, Priority & Lost Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="cvb-card p-5 space-y-3">
          <h3 className="font-semibold text-sm text-[#173D32] flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-600" /> E. Recomendaciones Accionables para Acelerar Ventas
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {data.recommendations.map((r: string, i: number) => (
              <li key={i} className="p-2.5 rounded-lg bg-[#F4EFE5]/60 border border-[#173D32]/10">• {r}</li>
            ))}
          </ul>

          <h3 className="font-semibold text-sm text-[#173D32] pt-3 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-red-600" /> F. Análisis de Ventas Perdidas
          </h3>
          {data.lostSalesAnalysis?.length ? (
            <div className="space-y-1.5 text-xs">
              {data.lostSalesAnalysis.map((ls: any) => (
                <div key={ls.reason} className="flex justify-between p-2 rounded bg-red-50/60 border border-red-100">
                  <span className="font-medium text-red-900">{ls.reason}</span>
                  <b className="text-red-800">{ls.count} operación(es)</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400">Sin ventas perdidas registradas</div>
          )}
        </div>

        <div className="cvb-card p-5 space-y-3">
          <h3 className="font-semibold text-sm text-[#173D32]">C. Priorización de Compradores (Afinidad y Respuesta Esperada)</h3>
          <div className="space-y-2 text-xs">
            {data.buyerPrioritization.map((b: any) => (
              <div key={b.buyerId} className="p-2.5 rounded-lg border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#173D32]">{b.buyerName}</div>
                  <div className="text-[11px] text-slate-500">{b.country} • Ventana resp.: {b.expectedResponseWindow}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#173D32] text-white font-bold">{b.priorityScore}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
