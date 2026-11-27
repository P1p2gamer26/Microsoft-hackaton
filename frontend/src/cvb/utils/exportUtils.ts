// @ts-nocheck
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function flattenRow(obj: Record<string, any>): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === null || v === undefined) out[k] = '';
    else if (typeof v === 'object') out[k] = JSON.stringify(v);
    else out[k] = v;
  }
  return out;
}

export function exportToExcel(filename: string, sheetName: string, rows: any[]) {
  const flat = rows.map(flattenRow);
  const ws = XLSX.utils.json_to_sheet(flat.length ? flat : [{ Mensaje: 'Sin registros para exportar' }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPdf(filename: string, title: string, rows: any[], subtitle?: string) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFillColor(23, 61, 50);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text('COFFEE VALUE BRIDGE — ASOEXPORT', 14, 10);
  doc.setFontSize(10);
  doc.text(title, 14, 17);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(8);
  doc.text(
    subtitle || `Generado: ${new Date().toLocaleString('es-CO')} | Incluye trazabilidad de procedencia (OFICIAL / USUARIO / ESTIMADO / SIMULADO)`,
    14,
    28
  );

  if (!rows || rows.length === 0) {
    doc.text('No existen registros para el filtro seleccionado.', 14, 38);
  } else {
    const flat = rows.map(flattenRow);
    const cols = Object.keys(flat[0]).slice(0, 9);
    const body = flat.map((r) => cols.map((c) => String(r[c] ?? '').slice(0, 42)));
    autoTable(doc, {
      startY: 32,
      head: [cols],
      body,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [56, 107, 77] },
    });
  }
  doc.save(`${filename}.pdf`);
}
