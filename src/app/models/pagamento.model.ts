import { FormaPagamento } from './forma-pagamento';
import { Periodicidade } from './periodicidade';

// Uma cobranca da assinatura (simulada, RN15). Plano e periodicidade sao os da epoca.
// O usuario aparece so por nome e e-mail (sem documento nem telefone).
export interface Pagamento {
  id: number;
  // "yyyy-MM-dd"
  dataPagamento: string;
  idUsuario: number;
  nomeUsuario: string;
  emailUsuario: string;
  idPlano: number;
  nomePlano: string;
  periodicidade: Periodicidade;
  idCupom: number | null;
  codigoCupom: string | null;
  valor: number;
  // quanto o cupom tirou do preco cheio (zero sem cupom)
  valorDesconto: number;
  formaPagamento: FormaPagamento;
  status: { id: number; nome: string };
  // nulos se nao foi estornado
  dataEstorno: string | null;
  motivoEstorno: string | null;
  estornadoPor: string | null;
}

// resumo da lista: quantidade e soma por situacao
export interface TotalPorStatus {
  status: { id: number; nome: string };
  quantidade: number;
  valor: number;
}

// ids do enum StatusPagamento do back
export const PAGAMENTO_PENDENTE = 1;
export const PAGAMENTO_APROVADO = 2;
export const PAGAMENTO_RECUSADO = 3;
export const PAGAMENTO_ESTORNADO = 4;

// Pendente nao aparece: a cobranca simulada nunca deixa pagamento pendente
export const STATUS_PAGAMENTO = [
  { id: PAGAMENTO_APROVADO, nome: 'Aprovado' },
  { id: PAGAMENTO_RECUSADO, nome: 'Recusado' },
  { id: PAGAMENTO_ESTORNADO, nome: 'Estornado' },
];

// classe da etiqueta da situacao
export function tomDoPagamento(idStatus: number): string {
  switch (idStatus) {
    case PAGAMENTO_APROVADO: return 'tag tag-ok';
    case PAGAMENTO_RECUSADO: return 'tag tag-erro';
    case PAGAMENTO_ESTORNADO: return 'tag tag-info';
    default: return 'tag tag-alerta';
  }
}
