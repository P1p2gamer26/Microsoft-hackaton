import React, { useEffect, useState } from 'react';
import { Bot, Send, Upload, FileCheck2, AlertTriangle, ExternalLink, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { ProvenanceBadge } from '../components/ProvenanceBadge';
import { useAuth } from '../context/AuthContext';

export const ExportCopilotPage: React.FC = () => {
  const { can } = useAuth();
  const [prompt, setPrompt] = useState('Quiero exportar 500 kg de café tostado y molido a Estados Unidos. ¿Qué necesito?');
  const [analysis, setAnalysis] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [docType, setDocType] = useState('COMMERCIAL_INVOICE');
  const [uploading, setUploading] = useState(false);

  const runAnalysis = async (customPrompt = prompt) => {
    const res = await api.post('/copilot/analyze', { prompt: customPrompt });
    setAnalysis(res);
  };

  const loadDocs = () => {
    api.get('/copilot/documents').then(setDocuments).catch(() => {});
  };

  useEffect(() => {
    runAnalysis();
    loadDocs();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('documentType', docType);
      await api.post('/copilot/documents/upload', fd);
      loadDocs();
    } finally {
      setUploading(false);
    }
  };

  const validateDoc = async (id: number) => {
    await api.patch(`/copilot/documents/${id}`, { status: 'VALIDATED', validationNotes: 'Validado por analista de cumplimiento' });
    loadDocs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#173D32] flex items-center gap-2">
          <Bot className="w-6 h-6 text-[#386B4D]" /> Export Copilot — Asistente Inteligente de Exportaciones
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Guía regulatoria, requisitos sanitarios (FDA, Prior Notice, FSVP, EUDR, MHLW), responsabilidades y biblioteca documental con lectura PDF.
        </p>
      </div>

      {/* Interactive Query */}
      <div className="cvb-card p-4 bg-[#173D32] text-white space-y-3">
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runAnalysis()}
            className="w-full rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none"
          />
          <button onClick={() => runAnalysis()} className="px-4 py-2 rounded-lg bg-[#386B4D] hover:bg-[#46825f] text-sm font-semibold flex items-center gap-1.5 shrink-0">
            <Send className="w-4 h-4" /> Analizar
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          {[
            'Quiero exportar 500 kg de café tostado y molido a Estados Unidos. ¿Qué necesito?',
            'Quiero exportar 1200 kg de café tostado en grano a Alemania. Requisitos EUDR',
            'Exportación de 300 kg café tostado descafeinado a Japón',
          ].map((ex) => (
            <button key={ex} onClick={() => { setPrompt(ex); runAnalysis(ex); }} className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25">
              {ex.slice(0, 58)}...
            </button>
          ))}
        </div>
      </div>

      {analysis && (
        <div className="space-y-4">
          {/* Operation Summary */}
          <div className="cvb-card p-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            <div><span className="text-slate-500">Origen:</span><div className="font-bold text-[#173D32]">{analysis.operationSummary.originCountry}</div></div>
            <div><span className="text-slate-500">Destino:</span><div className="font-bold text-[#173D32]">{analysis.operationSummary.destinationCountry}</div></div>
            <div><span className="text-slate-500">Producto:</span><div className="font-bold">{analysis.operationSummary.productPresentation}</div></div>
            <div><span className="text-slate-500">Volumen:</span><div className="font-bold">{analysis.operationSummary.quantityKg} kg</div></div>
            <div><span className="text-slate-500">HS Sugerido:</span><div className="font-bold text-[#386B4D]">{analysis.operationSummary.suggestedHsCode}</div></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Regulatory Requirements with Official Sources */}
            <div className="cvb-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="font-semibold text-sm text-[#173D32]">Requisitos Sanitarios, Aduaneros y Etiquetado</h2>
                <span className="text-[11px] text-slate-500">Consulta: {analysis.consultationDate}</span>
              </div>
              <div className="space-y-2.5 text-xs">
                {analysis.regulatoryRequirements.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-lg border bg-[#F4EFE5]/30">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#173D32]">{r.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.mandatory ? 'bg-red-100 text-red-800' : 'bg-sky-100 text-sky-800'}`}>
                        {r.mandatory ? 'OBLIGATORIO' : 'RECOMENDADO'}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{r.description}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Responsable: <b>{r.responsibleParty}</b></span>
                      <a href={r.officialSourceUrl} target="_blank" rel="noreferrer" className="text-[#386B4D] underline flex items-center gap-0.5">
                        {r.officialSourceName} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Docs, Responsibilities, Timeline & Alerts */}
            <div className="space-y-4">
              <div className="cvb-card p-4 text-xs space-y-3">
                <h3 className="font-semibold text-sm text-[#173D32] border-b pb-1.5">Documentación Aplicable y Responsabilidades</h3>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {analysis.applicableDocuments.map((d: string, i: number) => <li key={i}>{d}</li>)}
                </ul>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <div className="font-bold text-[#173D32] mb-1">Exportador (Colombia)</div>
                    <ul className="space-y-1 text-slate-600">{analysis.exporterResponsibilities.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul>
                  </div>
                  <div>
                    <div className="font-bold text-[#4A3027] mb-1">Importador (Destino)</div>
                    <ul className="space-y-1 text-slate-600">{analysis.importerResponsibilities.map((x: string, i: number) => <li key={i}>• {x}</li>)}</ul>
                  </div>
                </div>
              </div>

              {analysis.missingDocumentAlerts?.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Alertas de Documentos Faltantes</div>
                  {analysis.missingDocumentAlerts.map((a: string, i: number) => <div key={i}>• {a}</div>)}
                </div>
              )}

              <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 text-xs text-slate-700 flex gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#4A3027]" />
                <span>{analysis.legalDisclaimer}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Library + PDF Upload */}
      <div className="cvb-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <h2 className="font-semibold text-[#173D32] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#386B4D]" /> Biblioteca Documental y Extracción PDF
            </h2>
            <p className="text-xs text-slate-500">Cargue documentos PDF para extraer metadatos (HS 090121/090122, FDA, origen Colombia) y gestionar validaciones.</p>
          </div>
          {can('COMPLIANCE_EDIT') && (
            <div className="flex items-center gap-2 text-xs">
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="cvb-input w-48">
                <option value="COMMERCIAL_INVOICE">Factura Comercial</option>
                <option value="PACKING_LIST">Lista de Empaque</option>
                <option value="TECH_SHEET">Ficha Técnica</option>
                <option value="ORIGIN_CERT">Certificado de Origen</option>
                <option value="SANITARY_CERT">Documento Sanitario</option>
                <option value="FDA_PRIOR_NOTICE">FDA Prior Notice</option>
                <option value="TRANSPORT_DOC">BL / AWB Transporte</option>
                <option value="CUSTOMS_DECL">Declaración Aduanera</option>
              </select>
              <label className="cvb-btn-primary cursor-pointer">
                <Upload className="w-4 h-4" /> {uploading ? 'Leyendo PDF...' : 'Cargar PDF'}
                <input type="file" accept=".pdf,.txt" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#173D32] text-white">
              <tr>
                <th className="p-2.5 text-left">Tipo</th>
                <th className="p-2.5 text-left">Archivo</th>
                <th className="p-2.5 text-left">Estado</th>
                <th className="p-2.5 text-left">Metadatos Extraídos / Notas</th>
                <th className="p-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documents.map((d) => (
                <tr key={d.id} className="hover:bg-[#F4EFE5]/40">
                  <td className="p-2.5 font-semibold text-[#173D32]">{d.documentType}</td>
                  <td className="p-2.5">{d.fileName}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'VALIDATED' ? 'bg-emerald-100 text-emerald-800'
                      : d.status === 'MISSING' ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                    }`}>{d.status}</span>
                  </td>
                  <td className="p-2.5 max-w-md truncate text-slate-600" title={d.extractedMetadataJson}>
                    {d.validationNotes} {d.extractedMetadataJson ? `| ${d.extractedMetadataJson}` : ''}
                  </td>
                  <td className="p-2.5 text-right">
                    {can('COMPLIANCE_EDIT') && d.status !== 'VALIDATED' && (
                      <button onClick={() => validateDoc(d.id)} className="text-xs px-2.5 py-1 rounded bg-[#386B4D] text-white hover:bg-[#173D32]">
                        Validar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
