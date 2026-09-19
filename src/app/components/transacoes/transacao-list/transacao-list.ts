import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Categoria } from '../../../models/categoria.model';
import { Transacao } from '../../../models/transacao.model';
import { CategoriaService, PagedResponse } from '../../../services/categoria.service';
import { TransacaoService } from '../../../services/transacao.service';

@Component({
  imports: [
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  selector: 'app-transacao-list',
  styleUrl: './transacao-list.css',
  templateUrl: './transacao-list.html',
})
export class TransacaoList implements OnInit {
  displayedColumns: string[] = ['numero', 'data', 'descricao', 'valor', 'categoria', 'tipo', 'escopo', 'acao'];
  dataSource = new MatTableDataSource<Transacao>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  descricaoFilter = '';
  idCategoriaFilter: number | null = null;
  categorias: Categoria[] = [];

  private readonly descricaoChanges = new Subject<string>();

  constructor(
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService,
  ) {}

  ngOnInit() {
    this.loadCategorias();
    this.loadTransacoes();

    this.descricaoChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.pageIndex = 0;
        this.loadTransacoes();
      });
  }

  loadCategorias() {
    this.categoriaService.findAll(0, 1000).subscribe({
      next: (response: PagedResponse<Categoria>) => (this.categorias = response.items),
      error: (error: unknown) => console.error('Erro ao buscar categorias:', error),
    });
  }

  loadTransacoes() {
    this.transacaoService
      .findAll(this.pageIndex, this.pageSize, {
        descricao: this.descricaoFilter,
        idCategoria: this.idCategoriaFilter ?? undefined,
      })
      .subscribe((response: PagedResponse<Transacao>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransacoes();
  }

  onDescricaoInput(value: string) {
    this.descricaoFilter = value;
    this.descricaoChanges.next(value);
  }

  onCategoriaChange() {
    this.pageIndex = 0;
    this.loadTransacoes();
  }

  limparFiltros() {
    this.descricaoFilter = '';
    this.idCategoriaFilter = null;
    this.pageIndex = 0;
    this.loadTransacoes();
  }
}
