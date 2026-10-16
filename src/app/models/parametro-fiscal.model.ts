export interface ParametroFiscal {
  id: number;
  chave: string;
  valor: number;
  // datas no formato "yyyy-MM-dd"
  vigenciaInicio: string;
  // null = sem data de fim
  vigenciaFim: string | null;
  // calculado pelo back: o parametro vale hoje
  vigente: boolean;
}

// Corpo enviado no POST/PUT (formato do ParametroFiscalRequestDTO do back)
export type ParametroFiscalRequest = Omit<ParametroFiscal, 'id' | 'vigente'>;
