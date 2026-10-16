export interface Cupom {
  id: number;
  codigo: string;
  percentualDesconto: number;
  // "yyyy-MM-dd"
  validade: string;
  ativo: boolean;
}

// Corpo enviado no POST/PUT (formato do CupomRequestDTO do back)
export type CupomRequest = Omit<Cupom, 'id'>;
