import { FormaPagamento } from './forma-pagamento';
import { Periodicidade } from './periodicidade';
import { StatusAssinatura } from './status-assinatura';

// Troca para um plano mais barato (ou cancelamento) que passa a valer na proxima cobranca
export interface TrocaAgendada {
  idPlano: number;
  nomePlano: string;
  periodicidade: Periodicidade;
  codigoCupom: string | null;
  formaPagamento: FormaPagamento;
  // valor cobrado na data, ja com o cupom
  valor: number;
  // "yyyy-MM-dd"
  data: string;
}

// A assinatura (unica) do usuario (RN16). Datas no formato "yyyy-MM-dd".
export interface Assinatura {
  id: number;
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  idPlano: number;
  nomePlano: string;
  periodicidade: Periodicidade;
  idCupom: number | null;
  codigoCupom: string | null;
  percentualDesconto: number | null;
  formaPagamento: FormaPagamento;
  status: StatusAssinatura;
  dataInicio: string;
  // preco de cada cobranca do plano vigente
  valor: number;
  dataInicioPeriodo: string;
  // null no plano gratuito (nao ha cobranca)
  dataProximaCobranca: string | null;
  trocaAgendada: TrocaAgendada | null;
  observacao: string | null;
}

// O essencial da assinatura que vem em cada linha da listagem de usuarios
export interface AssinaturaResumo {
  idPlano: number;
  nomePlano: string;
  periodicidade: Periodicidade;
  valor: number;
  dataProximaCobranca: string | null;
  // plano que passa a valer na proxima cobranca; null se nada estiver agendado
  nomePlanoAgendado: string | null;
}

// Corpo da troca de plano (TrocaPlanoDTO do back). Sem forma de pagamento vale a ja usada.
export interface TrocaPlanoRequest {
  idPlano: number;
  idPeriodicidade: number;
  idCupom: number | null;
  idFormaPagamento: number | null;
}

// ids do enum EfeitoTroca do back
export const EFEITO_IMEDIATO = 1;
export const EFEITO_AGENDADO = 2;
export const EFEITO_DESFAZ_AGENDAMENTO = 3;

// Resultado (ou previa) de uma troca de plano
export interface TrocaPlanoResultado {
  efeito: { id: number; nome: string };
  // saldo nao usado do periodo atual que vira dias do plano novo
  credito: number;
  diasCobertos: number;
  // cobrado hoje (ex.: saindo do Gratuito)
  valorCobradoAgora: number;
  // quando o plano novo comeca a ser cobrado (ou a troca agendada vale); null = sem cobranca
  dataProximaCobranca: string | null;
  valorProximaCobranca: number;
  assinatura: Assinatura;
}
