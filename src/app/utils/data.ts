// O back trabalha com LocalDate ("yyyy-MM-dd"); o datepicker trabalha com Date.

// formato de exibicao de datas em todo o front (pipe date, formatDate e campos de data)
export const FORMATO_DATA = 'dd/MM/yyyy';

// Date (ou string) -> "yyyy-MM-dd", usando a data LOCAL (sem converter para UTC)
export function paraDataIso(data: Date | string | null | undefined): string | null {
  if (!data) return null;
  if (typeof data === 'string') return data.substring(0, 10);

  const yyyy = data.getFullYear();
  const mm = String(data.getMonth() + 1).padStart(2, '0');
  const dd = String(data.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// "yyyy-MM-dd" -> Date local. new Date("2026-12-31") seria meia-noite UTC,
// que no Brasil (UTC-3) aparece como o dia anterior no datepicker.
export function deDataIso(data: string | null | undefined): Date | null {
  if (!data) return null;

  const [ano, mes, dia] = data.substring(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function hojeIso(): string {
  return paraDataIso(new Date()) as string;
}
