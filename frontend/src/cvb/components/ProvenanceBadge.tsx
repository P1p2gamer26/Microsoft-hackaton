// @ts-nocheck
import React from 'react';

const STYLES: Record<string, { label: string; cls: string }> = {
  OFFICIAL: { label: 'OFICIAL', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  USER_INPUT: { label: 'USUARIO', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
  ESTIMATED: { label: 'ESTIMADO', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  SIMULATED: { label: 'SIMULADO (DEMO)', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
};

export const ProvenanceBadge: React.FC<{ value?: string }> = ({ value = 'SIMULATED' }) => {
  const s = STYLES[value] || STYLES.SIMULATED;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
};
