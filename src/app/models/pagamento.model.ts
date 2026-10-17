import { FormaPagamento } from './forma-pagamento';
import { Periodicidade } from './periodicidade';

// Uma cobranca da assinatura (simulada e ja aprovada, RN15). Plano e periodicidade sao os da epoca.
export interface Pagamento {
  id: number;
  // "yyyy-MM-dd"
  dataPagamento: string;
  nomePlano: string;
  periodicidade: Periodicidade;
  codigoCupom: string | null;
  valor: number;
  formaPagamento: FormaPagamento;
  status: { id: number; nome: string };
}
