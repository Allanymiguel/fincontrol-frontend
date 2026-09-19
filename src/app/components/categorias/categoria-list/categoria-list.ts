import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Categoria } from '../../../models/categoria.model';
import { CategoriaService, PagedResponse } from '../../../services/categoria.service';

@Component({
  imports: [
    MatTableModule,
    MatPaginatorModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  selector: 'app-categoria-list',
  styleUrl: './categoria-list.css',
  templateUrl: './categoria-list.html',
})
export class CategoriaList implements OnInit {
  displayedColumns: string[] = ['numero', 'nome', 'tipo', 'cor', 'ativa', 'acao'];
  dataSource = new MatTableDataSource<Categoria>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  constructor(private categoriaService: CategoriaService) {}

  ngOnInit() {
    this.loadCategorias();
  }

  loadCategorias() {
    this.categoriaService.findAll(this.pageIndex, this.pageSize).subscribe((response: PagedResponse<Categoria>) => {
      this.dataSource.data = response.items;
      this.pageIndex = response.page;
      this.pageSize = response.pageSize;
      this.totalItems = response.totalItems;
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCategorias();
  }
}
