export interface FaixaIrpf {
  id: number;
  limiteInferior: number;
  // null na ultima faixa ("acima de ...")
  limiteSuperior: number | null;
  // percentual, de 0 a 100
  aliquota: number;
  parcelaDeduzir: number;
  // "yyyy-MM-dd": as faixas com o mesmo inicio formam uma tabela
  vigenciaInicio: string;
}

// Corpo enviado no POST/PUT (formato do FaixaIrpfRequestDTO do back)
export type FaixaIrpfRequest = Omit<FaixaIrpf, 'id'>;
