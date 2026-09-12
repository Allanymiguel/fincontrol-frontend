import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriaService } from '../../../services/categoria.service';
import { Categoria } from '../../../models/categoria.model';
import { TIPO_TRANSACAO_LABELS, TipoTransacao } from '../../../models/tipo-transacao';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  imports: [MatTableModule, MatInputModule, MatFormFieldModule,
            MatToolbarModule, MatButtonModule, MatIconModule, RouterLink
            ],
  selector: 'app-categoria-list',
  styleUrl: './categoria-list.css',
  templateUrl: './categoria-list.html',
})
export class CategoriaList {

  displayedColumns: string[] = ['numero', 'nome', 'tipo', 'cor', 'ativa', 'acao'];
  dataSource = new MatTableDataSource<Categoria>();

  constructor(private categoriaService: CategoriaService) { }

  ngOnInit() {
    this.categoriaService.findAll().subscribe((categorias: Categoria[]) => {
      this.dataSource.data = categorias;
    });
  }

  tipoLabel(tipo: TipoTransacao): string {
    return TIPO_TRANSACAO_LABELS[tipo];
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
