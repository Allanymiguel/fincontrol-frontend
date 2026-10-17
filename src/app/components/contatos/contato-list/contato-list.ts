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
import { Contato } from '../../../models/contato.model';
import { PagedResponse } from '../../../services/categoria.service';
import { ContatoService } from '../../../services/contato.service';
import { formatarCep, formatarDocumento } from '../../../utils/documento';

@Component({
  imports: [
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  selector: 'app-contato-list',
  styleUrl: './contato-list.css',
  templateUrl: './contato-list.html',
})
export class ContatoList implements OnInit {
  displayedColumns: string[] = ['numero', 'nome', 'tipo', 'documento', 'cidade', 'cep', 'acao'];
  dataSource = new MatTableDataSource<Contato>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  nomeFilter = '';
  private readonly nomeChanges = new Subject<string>();

  readonly formatarDocumento = formatarDocumento;
  readonly formatarCep = formatarCep;

  constructor(private contatoService: ContatoService) {}

  ngOnInit() {
    this.loadContatos();

    this.nomeChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.loadContatos();
    });
  }

  loadContatos() {
    this.contatoService.findAll(this.pageIndex, this.pageSize, this.nomeFilter).subscribe({
      next: (response: PagedResponse<Contato>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar contatos:', error),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadContatos();
  }

  onNomeInput(value: string) {
    this.nomeFilter = value;
    this.nomeChanges.next(value);
  }

  limparFiltro() {
    this.nomeFilter = '';
    this.pageIndex = 0;
    this.loadContatos();
  }
}
