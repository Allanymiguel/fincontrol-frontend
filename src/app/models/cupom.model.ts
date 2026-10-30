export interface PlanoDoCupom {
  id: number;
  nome: string;
}

export interface Cupom {
  id: number;
  codigo: string;
  percentualDesconto: number;
  // "yyyy-MM-dd"
  validade: string;
  ativo: boolean;
  // nulo = sem limite
  limiteUsos: number | null;
  // vazio = vale para todos os planos
  planos: PlanoDoCupom[];
  // metricas: usos = adesoes (contam para o limite); pagamentos aprovados com o cupom e o desconto concedido neles
  usos: number;
  pagamentos: number;
  descontoConcedido: number;
}

// Corpo enviado no POST/PUT (formato do CupomRequestDTO do back)
export interface CupomRequest {
  codigo: string;
  percentualDesconto: number;
  validade: string;
  ativo: boolean;
  limiteUsos: number | null;
  // vazio = todos os planos
  idPlanos: number[];
}

// o limite ja foi atingido: o cupom nao aceita novas adesoes
export function cupomEsgotado(cupom: Cupom): boolean {
  return cupom.limiteUsos != null && cupom.usos >= cupom.limiteUsos;
}

// "Essencial, Empreendedor" ou "Todos"
export function planosDoCupom(cupom: Cupom): string {
  return cupom.planos.length === 0 ? 'Todos' : cupom.planos.map((plano) => plano.nome).join(', ');
}
