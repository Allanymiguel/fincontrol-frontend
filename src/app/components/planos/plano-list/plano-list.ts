import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Plano } from '../../../models/plano.model';
import { PagedResponse } from '../../../services/categoria.service';
import { PlanoService } from '../../../services/plano.service';

@Component({
  imports: [
    DecimalPipe,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  selector: 'app-plano-list',
  styleUrl: './plano-list.css',
  templateUrl: './plano-list.html',
})
export class PlanoList implements OnInit {
  displayedColumns: string[] = ['numero', 'nome', 'precoMensal', 'precoAnual', 'limites', 'modulos', 'ativo', 'acao'];
  dataSource = new MatTableDataSource<Plano>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  nomeFilter = '';
  private readonly nomeChanges = new Subject<string>();

  constructor(private planoService: PlanoService) {}

  ngOnInit() {
    this.loadPlanos();

    this.nomeChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.loadPlanos();
    });
  }

  loadPlanos() {
    this.planoService.findAll(this.pageIndex, this.pageSize, this.nomeFilter).subscribe({
      next: (response: PagedResponse<Plano>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar planos:', error),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPlanos();
  }

  onNomeInput(value: string) {
    this.nomeFilter = value;
    this.nomeChanges.next(value);
  }

  limparFiltro() {
    this.nomeFilter = '';
    this.pageIndex = 0;
    this.loadPlanos();
  }

  // nomes dos modulos que o plano libera, para exibir na tabela
  modulos(plano: Plano): string[] {
    const modulos: string[] = [];
    if (plano.liberaRecorrencias) modulos.push('Recorrências');
    if (plano.liberaFiscal) modulos.push('Fiscal');
    if (plano.liberaExportacao) modulos.push('Exportação');
    return modulos;
  }
}
