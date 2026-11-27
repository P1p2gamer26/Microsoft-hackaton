// @ts-nocheck
import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { api } from '../api/client';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';

const REPORT_CATALOG = [
  { code: 'MARKETS', name: 'Mercados Internacionales', desc: 'Importaciones HS 090121/090122 y Market Opportunity Score' },
  { code: 'BUYERS', name: 'Compradores Potenciales', desc: 'Directorio B2B, fuentes, verificación y ubicación' },
  { code: 'PIPELINE', name: 'Pipeline Comercial CRM', desc: 'Oportunidades activas, probabilidades y tiempos en etapa' },
  { code: 'CLOSED_SALES', name: 'Ventas Cerradas', desc: 'Operaciones ganadas y volumen comercializado' },
  { code: 'LOST_SALES', name: 'Ventas Perdidas', desc: 'Motivos de pérdida para mejora del Time to Market' },
  { code: 'EXPORT_COSTS', name: 'Costos de Exportación', desc: 'Desglose de costos productivos y logísticos' },
  { code: 'GREEN_VS_ROASTED', name: 'Comparativo Verde vs. Tostado', desc: 'Escenarios financieros simulados y diferenciales' },
  { code: 'LOGISTICS', name: 'Comparativo Logístico GIS', desc: 'Rutas, modos de transporte, tiempos y costos estimados' },
  { code: 'PROFITABILITY', name: 'Rentabilidad Financiera', desc: 'Margen bruto y operativo por operación exportadora' },
  { code: 'INVENTORY', name: 'Inventarios y Lotes', desc: 'Stock disponible, comprometido, antigüedad y vida útil' },
  { code: 'ORDERS', name: 'Pedidos y Despachos', desc: 'Seguimiento de 11 estados y desviaciones de fechas' },
  { code: 'TIME_TO_MARKET', name: 'Tiempo de Comercialización', desc: 'Métricas TTM calculadas desde time_events' },
  { code: 'BOTTLENECKS', name: 'Cuellos de Botella', desc: 'Etapas con mayor demora en el ciclo exportador' },
  { code: 'COMPANY_PERFORMANCE', name: 'Desempeño por Empresa', desc: 'Consolidado de empresas exportadoras registradas' },
];

export const ReportsPage: React.FC = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ title: string; rows: any[] } | null>(null);

  const runExport = async (code: string, format: 'excel' | 'pdf' | 'preview') => {
    setBusy(code);
    try {
      const res = await api.get(`/reports/${code}`);
      const rows = Array.isArray(res.rows) ? res.rows : [];
      if (format === 'preview') {
        setPreview({ title: res.title, rows });
      } else if (format === 'excel') {
        exportToExcel(`CVB_${code}_${new Date().toISOString().slice(0, 10)}`, code, rows);
      } else {
        exportToPdf(`CVB_${code}_${new Date().toISOString().slice(0, 10)}`, res.title, rows);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-[#386B4D]" /> Centro de Reportes e Indicadores Empresariales
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          14 reportes descargables en tiempo real en formato Excel (.xlsx) y PDF desde la base de datos centralizada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORT_CATALOG.map((rep) => (
          <div key={rep.code} className="cvb-card p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="font-semibold text-[#173D32] text-sm">{rep.name}</div>
              <div className="text-xs text-slate-500 mt-1">{rep.desc}</div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <button onClick={() => runExport(rep.code, 'excel')} disabled={busy === rep.code} className="cvb-btn-primary py-1.5 text-xs">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={() => runExport(rep.code, 'pdf')} disabled={busy === rep.code} className="cvb-btn-secondary py-1.5 text-xs">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={() => runExport(rep.code, 'preview')} className="text-xs text-[#386B4D] hover:underline ml-auto font-medium">
                Vista previa
              </button>
            </div>
          </div>
        ))}
      </div>

      {preview && (
        <div className="cvb-card p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-[#173D32]">{preview.title} ({preview.rows.length} registros)</h3>
            <button onClick={() => setPreview(null)} className="text-xs text-slate-500 hover:underline">Cerrar</button>
          </div>
          <pre className="text-[11px] bg-slate-50 p-3 rounded-lg overflow-auto max-h-64">{JSON.stringify(preview.rows.slice(0, 8), null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
