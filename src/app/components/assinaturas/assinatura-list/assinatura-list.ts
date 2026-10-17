import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import { Assinatura } from '../../../models/assinatura.model';
import { STATUS_ASSINATURA, StatusAssinatura } from '../../../models/status-assinatura';
import { AssinaturaService } from '../../../services/assinatura.service';
import { PagedResponse } from '../../../services/categoria.service';
import { ConfirmacaoService } from '../../../services/confirmacao.service';

// id 3 = CANCELADA (enum StatusAssinatura do back)
const STATUS_CANCELADA = 3;

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTooltipModule,
    RouterLink,
  ],
  selector: 'app-assinatura-list',
  styleUrl: './assinatura-list.css',
  templateUrl: './assinatura-list.html',
})
export class AssinaturaList implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  displayedColumns: string[] = [
    'numero', 'usuario', 'plano', 'status', 'periodicidade', 'valorPago', 'formaPagamento', 'dataInicio', 'dataFim', 'acao',
  ];
  dataSource = new MatTableDataSource<Assinatura>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  status: StatusAssinatura[] = STATUS_ASSINATURA;
  buscaFilter = '';
  idStatusFilter: number | null = null;
  private readonly buscaChanges = new Subject<string>();

  constructor(
    private assinaturaService: AssinaturaService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadAssinaturas();

    this.buscaChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.loadAssinaturas();
    });
  }

  loadAssinaturas() {
    this.assinaturaService.findAll(this.pageIndex, this.pageSize, this.buscaFilter, this.idStatusFilter).subscribe({
      next: (response: PagedResponse<Assinatura>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar assinaturas:', error),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAssinaturas();
  }

  onBuscaInput(value: string) {
    this.buscaFilter = value;
    this.buscaChanges.next(value);
  }

  onStatusChange() {
    this.pageIndex = 0;
    this.loadAssinaturas();
  }

  limparFiltro() {
    this.buscaFilter = '';
    this.idStatusFilter = null;
    this.pageIndex = 0;
    this.loadAssinaturas();
  }

  // ids do enum FormaPagamento do back: 1 Pix, 2 Cartao, 3 Boleto, 4 Nenhuma
  iconeForma(id: number | undefined): string {
    return ({ 1: 'qr_code_2', 2: 'credit_card', 3: 'receipt_long' } as Record<number, string>)[id ?? 0] ?? 'money_off';
  }

  isCancelada(assinatura: Assinatura): boolean {
    return assinatura.status?.id === STATUS_CANCELADA;
  }

  async cancelar(assinatura: Assinatura) {
    if (!(await this.confirmacao.confirmar({ titulo: 'Cancelar assinatura', mensagem: `Cancelar a assinatura de ${assinatura.nomeUsuario} no plano ${assinatura.nomePlano}?`, confirmar: 'Cancelar assinatura', perigo: true }))) return;

    this.assinaturaService.cancelar(assinatura.id).subscribe({
      next: () => {
        this.exibirMensagem('Assinatura cancelada.');
        this.loadAssinaturas();
      },
      error: (error: HttpErrorResponse) => {
        const problem = error.error as ApiProblem | null;
        this.exibirMensagem(problem?.errors?.[0]?.message ?? problem?.detail ?? 'Erro ao cancelar a assinatura.');
        console.error('Erro ao cancelar assinatura:', error);
      },
    });
  }

  private exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
