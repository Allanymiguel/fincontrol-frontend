import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Dashboard, PlanoQuantidade } from '../../../models/dashboard.model';
import { DashboardService } from '../../../services/dashboard.service';
import { hojeIso, paraDataIso } from '../../../utils/data';
import { ColunaGrafico, GraficoColunas, SerieGrafico } from '../grafico-colunas/grafico-colunas';

type Periodo = 'mes' | '3m' | '6m' | '12m';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_COMPLETOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];

// as duas primeiras cores de serie sao tokens validados para daltonismo; do terceiro plano pago
// em diante, os planos viram "Outros planos" em cinza (nunca uma cor gerada)
const CORES_PLANOS = ['var(--color-info)', 'var(--color-accent)'];
const COR_OUTROS = 'var(--color-text-muted)';

// Tela inicial do ADMIN: indicadores do negocio (assinaturas, receita, cadastros), sem acesso as
// financas pessoais dos usuarios. Cada numero vem do back; mes sem dado aparece como "sem historico".
@Component({
  imports: [
    DecimalPipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    GraficoColunas,
  ],
  selector: 'app-painel-admin',
  styleUrl: './painel-admin.css',
  templateUrl: './painel-admin.html',
})
export class PainelAdmin implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  readonly periodos: { id: Periodo; rotulo: string }[] = [
    { id: 'mes', rotulo: 'Este mês' },
    { id: '3m', rotulo: '3 meses' },
    { id: '6m', rotulo: '6 meses' },
    { id: '12m', rotulo: '12 meses' },
  ];

  readonly periodo = signal<Periodo>('6m');
  readonly dados = signal<Dashboard | null>(null);
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);

  readonly formulas = {
    mrr: 'Receita recorrente mensal de hoje: soma do valor de cada cobrança (já com cupom) das assinaturas pagas e ativas de contas ativas, convertido para mensal (anual ÷ 12). O plano Gratuito não entra.',
    receita: 'Pagamentos aprovados com data no mês (inclusive os estornados depois), menos os estornos feitos no mês. Recusados não entram.',
    risco: 'Receita mensal que já tem saída anunciada: diferença dos downgrades agendados, valor inteiro dos cancelamentos agendados, das contas desativadas com plano pago (voltam ao Gratuito na próxima cobrança) e das assinaturas com pagamento recusado (voltam ao Gratuito na 3ª recusa seguida).',
    cadastros: 'Contas de usuário (papel USER) com data de cadastro dentro do período.',
    conversao: 'Dos novos cadastros do período, quantos já tiveram algum pagamento aprovado. Toda conta nasce no plano Gratuito.',
    evolucao: 'Reconstruída a partir dos pagamentos: no fim de cada mês, uma assinatura conta como pagante do plano do seu pagamento aprovado mais recente, se ele ainda cobre aquele dia (1 mês ou 1 ano). Estornado continua cobrindo; recusado não.',
  };

  readonly mesReferencia = computed(() => {
    const dados = this.dados();
    return dados ? this.nomeDoMes(dados.receitaMesReferencia.mes) : '';
  });

  readonly colunasReceita = computed<ColunaGrafico[]>(() =>
    (this.dados()?.receitaPorMes ?? []).map((mes) => ({
      ...this.rotulos(mes.mes),
      semHistorico: mes.semHistorico,
      valores: [mes.liquido ?? 0],
    })),
  );

  readonly serieReceita: SerieGrafico[] = [{ nome: 'Receita líquida', cor: 'var(--color-accent)' }];

  // planos pagos na ordem do back (do mais barato ao mais caro), com no maximo duas cores
  private readonly planosPagos = computed<PlanoQuantidade[]>(() => {
    const comHistorico = this.dados()?.evolucao.find((mes) => !mes.semHistorico);
    return comHistorico?.pagantesPorPlano ?? [];
  });

  readonly seriesEvolucao = computed<SerieGrafico[]>(() => {
    const planos = this.planosPagos();
    const series = planos.slice(0, CORES_PLANOS.length).map((plano, i) => ({ nome: plano.nomePlano, cor: CORES_PLANOS[i] }));
    if (planos.length > CORES_PLANOS.length) series.push({ nome: 'Outros planos', cor: COR_OUTROS });
    return series;
  });

  readonly serieContas: SerieGrafico = { nome: 'Contas cadastradas', cor: 'var(--color-primary)' };

  readonly colunasEvolucao = computed<ColunaGrafico[]>(() => {
    const limite = CORES_PLANOS.length;
    return (this.dados()?.evolucao ?? []).map((mes) => {
      const quantidades = mes.pagantesPorPlano.map((plano) => plano.quantidade);
      const valores = quantidades.slice(0, limite);
      if (this.planosPagos().length > limite)
        valores.push(quantidades.slice(limite).reduce((soma, q) => soma + q, 0));
      return {
        ...this.rotulos(mes.mes),
        semHistorico: mes.semHistorico,
        valores: mes.semHistorico ? [] : valores,
        linha: mes.contasCadastradas,
      };
    });
  });

  readonly maiorAssinantes = computed(() =>
    Math.max(1, ...(this.dados()?.assinantesPorPlano ?? []).map((plano) => plano.quantidade)),
  );

  readonly totalAssinantes = computed(() =>
    (this.dados()?.assinantesPorPlano ?? []).reduce((soma, plano) => soma + plano.quantidade, 0),
  );

  readonly mesesSemHistorico = computed(() =>
    (this.dados()?.receitaPorMes ?? []).filter((mes) => mes.semHistorico).length,
  );

  ngOnInit(): void {
    this.carregar();
  }

  escolherPeriodo(periodo: Periodo): void {
    if (periodo === this.periodo()) return;
    this.periodo.set(periodo);
    this.carregar();
  }

  // ao trocar o periodo, os numeros anteriores ficam na tela (esmaecidos) ate os novos chegarem
  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    const [inicio, fim] = this.intervalo(this.periodo());
    this.dashboardService.buscar(inicio, fim).subscribe({
      next: (dados) => {
        this.dados.set(dados);
        this.carregando.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erro.set(error.error?.detail ?? 'Não foi possível carregar os indicadores.');
      },
    });
  }

  larguraAssinantes(quantidade: number): number {
    return (quantidade / this.maiorAssinantes()) * 100;
  }

  // do 1o dia do mes (N-1 meses atras) ate hoje
  private intervalo(periodo: Periodo): [string, string] {
    const meses = { mes: 1, '3m': 3, '6m': 6, '12m': 12 }[periodo];
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - (meses - 1), 1);
    return [paraDataIso(inicio) as string, hojeIso()];
  }

  // "2026-05" -> mai / 26 / "maio de 2026"
  private rotulos(mes: string): Pick<ColunaGrafico, 'rotulo' | 'sufixo' | 'rotuloCompleto'> {
    const [ano, numero] = mes.split('-').map(Number);
    return { rotulo: MESES[numero - 1], sufixo: String(ano).slice(2), rotuloCompleto: this.nomeDoMes(mes) };
  }

  private nomeDoMes(mes: string): string {
    const [ano, numero] = mes.split('-').map(Number);
    return `${MESES_COMPLETOS[numero - 1]} de ${ano}`;
  }
}
