// Indicadores do painel do admin (GET /admin/dashboard). So assinatura, plano e pagamento:
// nada das financas pessoais. As formulas estao no Swagger e nos tooltips da tela.
export interface ValorQuantidade {
  valor: number;
  assinaturas: number;
}

export interface ReceitaEmRisco {
  total: number;
  downgrades: ValorQuantidade;
  cancelamentos: ValorQuantidade;
  contasDesativadas: ValorQuantidade;
  // pagamento recusado aguardando nova tentativa (volta ao Gratuito na 3a recusa)
  pagamentosRecusados: ValorQuantidade;
}

// mes = "AAAA-MM"; semHistorico = mes anterior ao primeiro dado do sistema (valores nulos).
// aprovado: pagamentos com data no mes (inclusive os estornados depois); estornado: estornos feitos no mes
export interface ReceitaMensal {
  mes: string;
  semHistorico: boolean;
  aprovado: number | null;
  estornado: number | null;
  liquido: number | null;
}

export interface PlanoQuantidade {
  idPlano: number;
  nomePlano: string;
  gratuito: boolean;
  quantidade: number;
}

export interface EvolucaoMensal {
  mes: string;
  semHistorico: boolean;
  contasCadastradas: number | null;
  pagantesPorPlano: PlanoQuantidade[];
}

export interface Cadastros {
  novos: number;
  convertidos: number;
  // percentual; null quando nao houve cadastro no periodo
  taxaConversao: number | null;
}

export interface Dashboard {
  // "yyyy-MM-dd"
  inicio: string;
  fim: string;
  mrr: ValorQuantidade;
  receitaEmRisco: ReceitaEmRisco;
  receitaMesReferencia: ReceitaMensal;
  receitaPorMes: ReceitaMensal[];
  assinantesPorPlano: PlanoQuantidade[];
  evolucao: EvolucaoMensal[];
  cadastros: Cadastros;
}
