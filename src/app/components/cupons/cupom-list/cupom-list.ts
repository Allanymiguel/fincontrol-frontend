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
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { Cupom } from '../../../models/cupom.model';
import { PagedResponse } from '../../../services/categoria.service';
import { CupomService } from '../../../services/cupom.service';
import { hojeIso } from '../../../utils/data';

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  selector: 'app-cupom-list',
  styleUrl: './cupom-list.css',
  templateUrl: './cupom-list.html',
})
export class CupomList implements OnInit {
  displayedColumns: string[] = ['numero', 'codigo', 'desconto', 'validade', 'situacao', 'acao'];
  dataSource = new MatTableDataSource<Cupom>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  codigoFilter = '';
  private readonly codigoChanges = new Subject<string>();
  private readonly hoje = hojeIso();

  constructor(private cupomService: CupomService) {}

  ngOnInit() {
    this.loadCupons();

    this.codigoChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.loadCupons();
    });
  }

  loadCupons() {
    this.cupomService.findAll(this.pageIndex, this.pageSize, this.codigoFilter).subscribe({
      next: (response: PagedResponse<Cupom>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar cupons:', error),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCupons();
  }

  onCodigoInput(value: string) {
    this.codigoFilter = value;
    this.codigoChanges.next(value);
  }

  limparFiltro() {
    this.codigoFilter = '';
    this.pageIndex = 0;
    this.loadCupons();
  }

  // ativo e dentro da validade = pode ser usado hoje
  situacao(cupom: Cupom): 'ativo' | 'inativo' | 'expirado' {
    if (!cupom.ativo) return 'inativo';
    return cupom.validade < this.hoje ? 'expirado' : 'ativo';
  }
}
