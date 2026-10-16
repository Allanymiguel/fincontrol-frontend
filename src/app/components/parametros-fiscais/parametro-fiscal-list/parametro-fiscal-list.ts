import { DatePipe, DecimalPipe } from '@angular/common';
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
import { ParametroFiscal } from '../../../models/parametro-fiscal.model';
import { PagedResponse } from '../../../services/categoria.service';
import { ParametroFiscalService } from '../../../services/parametro-fiscal.service';

@Component({
  imports: [
    DatePipe,
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
  selector: 'app-parametro-fiscal-list',
  styleUrl: './parametro-fiscal-list.css',
  templateUrl: './parametro-fiscal-list.html',
})
export class ParametroFiscalList implements OnInit {
  displayedColumns: string[] = ['numero', 'chave', 'valor', 'vigencia', 'situacao', 'acao'];
  dataSource = new MatTableDataSource<ParametroFiscal>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  chaveFilter = '';
  private readonly chaveChanges = new Subject<string>();

  constructor(private parametroFiscalService: ParametroFiscalService) {}

  ngOnInit() {
    this.loadParametros();

    this.chaveChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.loadParametros();
    });
  }

  loadParametros() {
    this.parametroFiscalService.findAll(this.pageIndex, this.pageSize, this.chaveFilter).subscribe({
      next: (response: PagedResponse<ParametroFiscal>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar parâmetros fiscais:', error),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadParametros();
  }

  onChaveInput(value: string) {
    this.chaveFilter = value;
    this.chaveChanges.next(value);
  }

  limparFiltro() {
    this.chaveFilter = '';
    this.pageIndex = 0;
    this.loadParametros();
  }
}
