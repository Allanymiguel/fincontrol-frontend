import { FormaPagamento } from './forma-pagamento';
import { Periodicidade } from './periodicidade';
import { StatusAssinatura } from './status-assinatura';

export interface Assinatura {
  id: number;
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  idPlano: number;
  nomePlano: string;
  idCupom: number | null;
  codigoCupom: string | null;
  percentualDesconto: number | null;
  status: StatusAssinatura;
  // datas no formato "yyyy-MM-dd"; dataFim null = vigente, sem prazo
  dataInicio: string;
  dataFim: string | null;
  periodicidade: Periodicidade;
  valorPago: number;
  formaPagamento: FormaPagamento;
  observacao: string | null;
}

// Corpo do POST (AssinaturaRequestDTO do back). O valor pago e calculado pelo back.
export interface AssinaturaRequest {
  idUsuario: number;
  idPlano: number;
  idCupom: number | null;
  idPeriodicidade: number;
  idFormaPagamento: number;
  observacao: string | null;
}

// Corpo do PUT (AssinaturaUpdateDTO do back): so os campos editaveis
export interface AssinaturaUpdate {
  idStatus: number;
  dataFim: string | null;
  observacao: string | null;
}
