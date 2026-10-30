import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FORMAS_PAGAMENTO, FORMA_PAGAMENTO_NENHUMA } from '../../../models/forma-pagamento';
import {
  PAGAMENTO_APROVADO,
  PAGAMENTO_ESTORNADO,
  PAGAMENTO_RECUSADO,
  Pagamento,
  STATUS_PAGAMENTO,
  TotalPorStatus,
  tomDoPagamento,
} from '../../../models/pagamento.model';
import { Plano } from '../../../models/plano.model';
import { FiltroPagamento, PagamentoService } from '../../../services/pagamento.service';
import { PlanoService } from '../../../services/plano.service';
import { deDataIso, paraDataIso } from '../../../utils/data';
import { EstornoDialog } from '../estorno-dialog/estorno-dialog';

// Pagamentos de todas as assinaturas (relacao do usuario com o FinControl): filtros, totais por
// situacao e o estorno. O usuario aparece so por nome e e-mail.
@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
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
  selector: 'app-pagamento-list',
  styleUrl: './pagamento-list.css',
  templateUrl: './pagamento-list.html',
})
export class PagamentoList implements OnInit {
  private readonly pagamentoService = inject(PagamentoService);
  private readonly planoService = inject(PlanoService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly situacoes = STATUS_PAGAMENTO;
  readonly formas = FORMAS_PAGAMENTO.filter((forma) => forma.id !== FORMA_PAGAMENTO_NENHUMA);
  readonly tom = tomDoPagamento;
  readonly deDataIso = deDataIso;
  readonly APROVADO = PAGAMENTO_APROVADO;
  readonly ESTORNADO = PAGAMENTO_ESTORNADO;
  readonly RECUSADO = PAGAMENTO_RECUSADO;

  displayedColumns: string[] = ['data', 'usuario', 'plano', 'forma', 'valor', 'status', 'acao'];
  dataSource = new MatTableDataSource<Pagamento>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  readonly planos = signal<Plano[]>([]);
  readonly totais = signal<TotalPorStatus[]>([]);
  busca = '';
  inicio: Date | null = null;
  fim: Date | null = null;
  idPlano: number | null = null;
  idFormaPagamento: number | null = null;
  idStatus: number | null = null;
  private readonly buscaChanges = new Subject<string>();

  ngOnInit(): void {
    this.busca = this.route.snapshot.queryParamMap.get('busca') ?? '';
    this.planoService.findAll(0, 100).subscribe({
      next: (resposta) => this.planos.set(resposta.items),
      error: (error: unknown) => console.error('Erro ao buscar planos:', error),
    });
    this.buscaChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.filtrar());
    this.filtrar();
  }

  private filtro(): FiltroPagamento {
    return {
      inicio: paraDataIso(this.inicio),
      fim: paraDataIso(this.fim),
      idPlano: this.idPlano,
      idFormaPagamento: this.idFormaPagamento,
      idStatus: this.idStatus,
      busca: this.busca,
    };
  }

  carregar(): void {
    this.pagamentoService.buscar(this.pageIndex, this.pageSize, this.filtro()).subscribe({
      next: (resposta) => {
        this.dataSource.data = resposta.items;
        this.pageIndex = resposta.page;
        this.pageSize = resposta.pageSize;
        this.totalItems = resposta.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar pagamentos:', error),
    });
  }

  carregarTotais(): void {
    this.pagamentoService.resumo(this.filtro()).subscribe({
      next: (totais) => this.totais.set(totais),
      error: (error: unknown) => console.error('Erro ao buscar o resumo dos pagamentos:', error),
    });
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregar();
    this.carregarTotais();
  }

  onBuscaInput(valor: string): void {
    this.busca = valor;
    this.buscaChanges.next(valor);
  }

  onPeriodoChange(): void {
    if ((this.inicio && this.fim) || (!this.inicio && !this.fim)) this.filtrar();
  }

  // o cartao do resumo filtra pela situacao (clicar de novo tira o filtro)
  filtrarSituacao(idStatus: number): void {
    this.idStatus = this.idStatus === idStatus ? null : idStatus;
    this.pageIndex = 0;
    this.carregar();
  }

  total(idStatus: number): TotalPorStatus | null {
    return this.totais().find((total) => total.status.id === idStatus) ?? null;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregar();
  }

  estornar(pagamento: Pagamento): void {
    this.dialog
      .open<EstornoDialog, Pagamento, Pagamento>(EstornoDialog, {
        data: pagamento,
        width: '560px',
        maxWidth: 'calc(100vw - 32px)',
      })
      .afterClosed()
      .subscribe((estornado) => {
        if (!estornado) return;
        this.snack.open(`Pagamento de ${estornado.nomeUsuario} estornado.`, 'Ok', { duration: 4000 });
        this.carregar();
        this.carregarTotais();
      });
  }
}
