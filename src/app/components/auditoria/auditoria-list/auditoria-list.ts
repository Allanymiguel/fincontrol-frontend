import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { EventoAuditoria, FiltroAuditoria, FiltrosAuditoria } from '../../../models/auditoria.model';
import { AuditoriaService } from '../../../services/auditoria.service';
import { paraDataIso } from '../../../utils/data';
import { AuditoriaDetalheDialog } from '../auditoria-detalhe-dialog/auditoria-detalhe-dialog';

// Quem fez o que e quando na area administrativa. Somente leitura: nenhum botao altera ou apaga.
// Aceita filtros pela URL (?idTipoAlvo=1&idAlvo=4) para abrir ja no historico de um alvo.
@Component({
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  selector: 'app-auditoria-list',
  styleUrl: './auditoria-list.css',
  templateUrl: './auditoria-list.html',
})
export class AuditoriaList implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);

  displayedColumns: string[] = ['dataHora', 'admin', 'evento', 'alvo', 'alteracoes', 'acao'];
  dataSource = new MatTableDataSource<EventoAuditoria>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  readonly opcoes = signal<FiltrosAuditoria>({ acoes: [], tiposAlvo: [], admins: [] });

  idAdmin: string | null = null;
  idAcao: number | null = null;
  idTipoAlvo: number | null = null;
  idAlvo: number | null = null;
  buscaFilter = '';
  inicio: Date | null = null;
  fim: Date | null = null;
  private readonly buscaChanges = new Subject<string>();

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.idTipoAlvo = this.numero(params.get('idTipoAlvo'));
    this.idAlvo = this.numero(params.get('idAlvo'));
    this.buscaFilter = params.get('busca') ?? '';

    this.auditoriaService.filtros().subscribe({
      next: (opcoes) => this.opcoes.set(opcoes),
      error: (error: unknown) => console.error('Erro ao buscar os filtros da auditoria:', error),
    });
    this.carregar();

    this.buscaChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.filtrar());
  }

  carregar(): void {
    this.auditoriaService.findAll(this.pageIndex, this.pageSize, this.filtro()).subscribe({
      next: (response) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar a auditoria:', error),
    });
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregar();
  }

  onBuscaInput(valor: string): void {
    this.buscaFilter = valor;
    this.buscaChanges.next(valor);
  }

  // o periodo so recarrega quando as duas pontas estao definidas (ou as duas vazias)
  onPeriodoChange(): void {
    if ((this.inicio && this.fim) || (!this.inicio && !this.fim)) this.filtrar();
  }

  // o alvo vindo da URL (ex.: historico de um usuario) sai junto com os outros filtros
  limparFiltros(): void {
    this.idAdmin = null;
    this.idAcao = null;
    this.idTipoAlvo = null;
    this.idAlvo = null;
    this.buscaFilter = '';
    this.inicio = null;
    this.fim = null;
    this.filtrar();
  }

  temFiltro(): boolean {
    return !!(this.idAdmin || this.idAcao || this.idTipoAlvo || this.idAlvo || this.buscaFilter || this.inicio || this.fim);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregar();
  }

  abrir(evento: EventoAuditoria): void {
    this.dialog.open(AuditoriaDetalheDialog, { data: evento, width: '720px', maxWidth: '95vw', autoFocus: false });
  }

  resumoAlteracoes(evento: EventoAuditoria): string {
    const n = evento.alteracoes.length;
    if (n === 0) return '—';
    const campos = evento.alteracoes.slice(0, 2).map((a) => a.campo).join(', ');
    return n > 2 ? `${campos} e mais ${n - 2}` : campos;
  }

  // acoes de exclusao e desativacao em vermelho; criacao e ativacao em verde
  tomDaAcao(evento: EventoAuditoria): 'erro' | 'ok' | 'neutro' {
    const nome = evento.acao.nome.toLowerCase();
    if (nome.startsWith('exclusão') || nome.startsWith('desativação') || nome.startsWith('cancelamento')) return 'erro';
    if (nome.startsWith('criação') || nome.startsWith('ativação')) return 'ok';
    return 'neutro';
  }

  private filtro(): FiltroAuditoria {
    return {
      idAdmin: this.idAdmin,
      idAcao: this.idAcao,
      idTipoAlvo: this.idTipoAlvo,
      idAlvo: this.idAlvo,
      busca: this.buscaFilter,
      inicio: paraDataIso(this.inicio),
      fim: paraDataIso(this.fim),
    };
  }

  private numero(valor: string | null): number | null {
    const n = Number(valor);
    return valor && Number.isFinite(n) ? n : null;
  }
}
