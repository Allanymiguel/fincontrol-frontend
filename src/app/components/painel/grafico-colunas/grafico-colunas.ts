import { formatNumber } from '@angular/common';
import { Component, LOCALE_ID, computed, inject, input, signal } from '@angular/core';

// cor = token de styles.css (ex.: 'var(--color-info)'); nunca uma cor solta
export interface SerieGrafico {
  nome: string;
  cor: string;
}

export interface ColunaGrafico {
  // rotulo curto do eixo (ex.: "mai") e o completo, para tooltip e tabela (ex.: "maio de 2026")
  rotulo: string;
  sufixo?: string;
  rotuloCompleto: string;
  // sem historico: nao desenha nada (nunca um zero falso)
  semHistorico: boolean;
  // um valor por serie empilhada, na ordem das series (a primeira fica embaixo)
  valores: number[];
  // valor da serie de linha, no mesmo eixo
  linha?: number | null;
}

type Formato = 'moeda' | 'inteiro';

const DIVISOES = 4;

// Colunas (empilhadas, se houver mais de uma serie) e uma linha opcional, num eixo so.
// Barras em HTML/CSS e a linha em SVG por cima; tooltip por coluna (mouse e teclado) e a
// tabela com os mesmos dados, para ninguem depender da cor nem do hover.
@Component({
  selector: 'app-grafico-colunas',
  styleUrl: './grafico-colunas.css',
  templateUrl: './grafico-colunas.html',
})
export class GraficoColunas {
  private readonly locale = inject(LOCALE_ID);

  readonly titulo = input.required<string>();
  readonly series = input.required<SerieGrafico[]>();
  readonly colunas = input.required<ColunaGrafico[]>();
  readonly serieLinha = input<SerieGrafico | null>(null);
  readonly formato = input<Formato>('inteiro');

  readonly ativa = signal<number | null>(null);

  readonly mostrarLegenda = computed(() => this.series().length + (this.serieLinha() ? 1 : 0) >= 2);

  // topo do eixo arredondado para um numero "redondo" (1, 2, 2,5 ou 5 x 10^n por divisao)
  readonly maximo = computed(() => {
    let maior = 0;
    for (const coluna of this.colunas()) {
      if (coluna.semHistorico) continue;
      maior = Math.max(maior, this.total(coluna), coluna.linha ?? 0);
    }
    if (maior <= 0) return this.formato() === 'moeda' ? 100 : DIVISOES;
    const bruto = maior / DIVISOES;
    const potencia = Math.pow(10, Math.floor(Math.log10(bruto)));
    const n = bruto / potencia;
    let passo = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * potencia;
    if (this.formato() === 'inteiro') passo = Math.max(1, Math.ceil(passo));
    return passo * DIVISOES;
  });

  readonly marcas = computed(() => {
    const maximo = this.maximo();
    return Array.from({ length: DIVISOES + 1 }, (_, i) => (maximo / DIVISOES) * i);
  });

  // com muitas colunas, so metade dos rotulos do eixo X aparece
  readonly rotuloAlternado = computed(() => this.colunas().length > 12);

  // pontos da linha em coordenadas 0-100 (x no centro da coluna)
  readonly pontosLinha = computed(() => {
    if (!this.serieLinha()) return [];
    const n = this.colunas().length;
    return this.colunas()
      .map((coluna, i) => ({ coluna, i }))
      .filter(({ coluna }) => !coluna.semHistorico && coluna.linha != null)
      .map(({ coluna, i }) => ({ x: this.centro(i, n), y: this.percentual(coluna.linha ?? 0) }));
  });

  readonly polyline = computed(() =>
    this.pontosLinha().map((p) => `${p.x},${100 - p.y}`).join(' '),
  );

  total(coluna: ColunaGrafico): number {
    return coluna.valores.reduce((soma, valor) => soma + valor, 0);
  }

  percentual(valor: number): number {
    return Math.min(100, (valor / this.maximo()) * 100);
  }

  centro(indice: number, quantidade: number): number {
    return ((indice + 0.5) / quantidade) * 100;
  }

  // segmentos com valor (zero nao vira um risco de 2px), da serie de baixo para a de cima
  segmentos(coluna: ColunaGrafico): { valor: number; cor: string }[] {
    return coluna.valores
      .map((valor, i) => ({ valor, cor: this.series()[i]?.cor ?? 'var(--color-text-muted)' }))
      .filter((segmento) => segmento.valor > 0);
  }

  formatar(valor: number | null | undefined, eixo = false): string {
    if (valor == null) return '—';
    if (this.formato() === 'moeda')
      return 'R$ ' + formatNumber(valor, this.locale, eixo ? '1.0-0' : '1.2-2');
    return formatNumber(valor, this.locale, '1.0-1');
  }

  // texto lido pelo leitor de tela ao focar a coluna (o mesmo que o tooltip mostra)
  descricao(coluna: ColunaGrafico): string {
    if (coluna.semHistorico) return `${coluna.rotuloCompleto}: sem histórico suficiente`;
    const partes = this.series().map((serie, i) => `${serie.nome} ${this.formatar(coluna.valores[i])}`);
    const linha = this.serieLinha();
    if (linha) partes.push(`${linha.nome} ${this.formatar(coluna.linha)}`);
    return `${coluna.rotuloCompleto}: ${partes.join(', ')}`;
  }

  // tooltip encostado na borda quando a coluna esta perto dela
  alinhamento(indice: number): 'inicio' | 'meio' | 'fim' {
    const n = this.colunas().length;
    if (n > 2 && indice < n / 5) return 'inicio';
    if (n > 2 && indice >= n - n / 5) return 'fim';
    return 'meio';
  }
}
