import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FaixaIrpf } from '../../../models/faixa-irpf.model';
import { PagedResponse } from '../../../services/categoria.service';
import { FaixaIrpfService } from '../../../services/faixa-irpf.service';

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  selector: 'app-faixa-irpf-list',
  styleUrl: './faixa-irpf-list.css',
  templateUrl: './faixa-irpf-list.html',
})
export class FaixaIrpfList implements OnInit {
  displayedColumns: string[] = ['numero', 'vigencia', 'faixa', 'aliquota', 'parcelaDeduzir', 'acao'];
  dataSource = new MatTableDataSource<FaixaIrpf>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  vigencias: string[] = [];
  vigenciaFilter: string | null = null;

  constructor(private faixaIrpfService: FaixaIrpfService) {}

  ngOnInit() {
    this.loadFaixas();

    this.faixaIrpfService.findVigencias().subscribe({
      next: (vigencias: string[]) => (this.vigencias = vigencias),
      error: (error: unknown) => console.error('Erro ao buscar vigências do IRPF:', error),
    });
  }

  loadFaixas() {
    this.faixaIrpfService.findAll(this.pageIndex, this.pageSize, this.vigenciaFilter).subscribe({
      next: (response: PagedResponse<FaixaIrpf>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar faixas do IRPF:', error),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadFaixas();
  }

  onVigenciaChange() {
    this.pageIndex = 0;
    this.loadFaixas();
  }

  limparFiltro() {
    this.vigenciaFilter = null;
    this.pageIndex = 0;
    this.loadFaixas();
  }
}
