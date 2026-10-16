export interface Plano {
  id: number;
  nome: string;
  precoMensal: number;
  precoAnual: number;
  limiteTransacoes: number;
  limiteMetas: number;
  liberaRecorrencias: boolean;
  liberaFiscal: boolean;
  liberaExportacao: boolean;
  ativo: boolean;
}

// Corpo enviado no POST/PUT (formato do PlanoRequestDTO do back)
export type PlanoRequest = Omit<Plano, 'id'>;
