import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiProblem } from '../../../models/api-problem.model';
import {
  ExecucaoCobranca,
  ORIGENS_EXECUCAO,
  ResumoCobranca,
  STATUS_EXECUCAO,
  STATUS_FALHA,
  STATUS_SUCESSO,
} from '../../../models/cobranca.model';
import { CobrancaService } from '../../../services/cobranca.service';
import { deDataIso, paraDataIso } from '../../../utils/data';
import { ExecucaoDetalheDialog } from '../execucao-detalhe-dialog/execucao-detalhe-dialog';
import { RodarCobrancaDialog } from '../rodar-cobranca-dialog/rodar-cobranca-dialog';

// Cobranca das assinaturas: "a de ontem rodou direito?", dias em que a automatica nao rodou,
// historico de execucoes (falhas em destaque) e o disparo manual ("cobrar ate" uma data).
@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  selector: 'app-cobranca-list',
  styleUrl: './cobranca-list.css',
  templateUrl: './cobranca-list.html',
})
export class CobrancaList implements OnInit {
  private readonly cobrancaService = inject(CobrancaService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly origens = ORIGENS_EXECUCAO;
  readonly situacoes = STATUS_EXECUCAO;
  readonly deDataIso = deDataIso;

  displayedColumns: string[] = ['dataReferencia', 'inicio', 'origem', 'status', 'assinaturas', 'pagamentos', 'valor', 'duracao', 'acao'];
  dataSource = new MatTableDataSource<ExecucaoCobranca>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  readonly resumo = signal<ResumoCobranca | null>(null);
  readonly rodando = signal(false);
  inicio: Date | null = null;
  fim: Date | null = null;
  idOrigem: number | null = null;
  idStatus: number | null = null;

  ngOnInit(): void {
    this.carregarResumo();
    this.carregar();
  }

  carregarResumo(): void {
    this.cobrancaService.resumo().subscribe({
      next: (resumo) => this.resumo.set(resumo),
      error: (error: unknown) => console.error('Erro ao buscar o resumo da cobrança:', error),
    });
  }

  carregar(): void {
    this.cobrancaService.execucoes(this.pageIndex, this.pageSize, {
      inicio: paraDataIso(this.inicio), fim: paraDataIso(this.fim), idOrigem: this.idOrigem, idStatus: this.idStatus,
    }).subscribe({
      next: (response) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar as execuções da cobrança:', error),
    });
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregar();
  }

  onPeriodoChange(): void {
    if ((this.inicio && this.fim) || (!this.inicio && !this.fim)) this.filtrar();
  }

  // atalho do alerta: so as falhas
  verFalhas(): void {
    this.idStatus = STATUS_FALHA;
    this.filtrar();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregar();
  }

  abrir(execucao: ExecucaoCobranca): void {
    this.dialog.open(ExecucaoDetalheDialog, { data: execucao, width: '680px', maxWidth: '95vw', autoFocus: false });
  }

  rodarAgora(): void {
    this.dialog
      .open<RodarCobrancaDialog, void, Date>(RodarCobrancaDialog, { width: '480px', maxWidth: 'calc(100vw - 32px)' })
      .afterClosed()
      .subscribe((data) => {
        if (data) this.processar(data);
      });
  }

  private processar(data: Date): void {
    this.rodando.set(true);
    this.cobrancaService.processar(paraDataIso(data)).subscribe({
      next: (r) => {
        this.rodando.set(false);
        const recusados = r.pagamentosRecusados > 0 ? `, ${r.pagamentosRecusados} recusado(s)` : '';
        this.snack.open(`Cobrança ${r.status.nome.toLowerCase()}: ${r.assinaturasProcessadas} assinatura(s), `
          + `${r.pagamentosGerados} pagamento(s)${recusados}, R$ ${r.valorTotal.toFixed(2).replace('.', ',')}.`, 'Ok',
          { duration: 6000 });
        this.carregarResumo();
        this.filtrar();
      },
      error: (error: HttpErrorResponse) => {
        this.rodando.set(false);
        const problem = error.error as ApiProblem | null;
        this.snack.open(problem?.detail ?? 'Não foi possível rodar a cobrança.', 'Ok', { duration: 6000 });
      },
    });
  }

  tom(execucao: ExecucaoCobranca): string {
    return execucao.status.id === STATUS_SUCESSO ? 'tag tag-ok' : execucao.status.id === STATUS_FALHA ? 'tag tag-erro' : 'tag tag-alerta';
  }

  falhou(execucao: ExecucaoCobranca): boolean {
    return execucao.status.id !== STATUS_SUCESSO;
  }

  ontemOk(): boolean {
    return this.resumo()?.automaticaDeOntem?.status.id === STATUS_SUCESSO;
  }
}
