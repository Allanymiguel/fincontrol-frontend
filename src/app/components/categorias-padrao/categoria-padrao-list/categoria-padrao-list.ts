import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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
import { CategoriaPadrao } from '../../../models/categoria-padrao.model';
import { TIPOS_TRANSACAO, TipoTransacao } from '../../../models/tipo-transacao';
import { PagedResponse } from '../../../services/categoria.service';
import { CategoriaPadraoService } from '../../../services/categoria-padrao.service';

@Component({
  imports: [
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
  selector: 'app-categoria-padrao-list',
  styleUrl: './categoria-padrao-list.css',
  templateUrl: './categoria-padrao-list.html',
})
export class CategoriaPadraoList implements OnInit {
  displayedColumns: string[] = ['numero', 'nome', 'tipo', 'cor', 'situacao', 'acao'];
  dataSource = new MatTableDataSource<CategoriaPadrao>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  tipos: TipoTransacao[] = TIPOS_TRANSACAO;
  nomeFilter = '';
  idTipoFilter: number | null = null;
  private readonly nomeChanges = new Subject<string>();

  constructor(
    private categoriaPadraoService: CategoriaPadraoService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadCategorias();

    this.nomeChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.loadCategorias();
    });
  }

  loadCategorias() {
    this.categoriaPadraoService
      .findAll(this.pageIndex, this.pageSize, this.nomeFilter, this.idTipoFilter)
      .subscribe({
        next: (response: PagedResponse<CategoriaPadrao>) => {
          this.dataSource.data = response.items;
          this.pageIndex = response.page;
          this.pageSize = response.pageSize;
          this.totalItems = response.totalItems;
        },
        error: (error: unknown) => console.error('Erro ao buscar categorias padrão:', error),
      });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCategorias();
  }

  onNomeInput(value: string) {
    this.nomeFilter = value;
    this.nomeChanges.next(value);
  }

  onTipoChange() {
    this.pageIndex = 0;
    this.loadCategorias();
  }

  // recarrega a pagina porque as arquivadas vao para o fim da lista
  alternarArquivada(categoria: CategoriaPadrao) {
    this.categoriaPadraoService.alternarArquivada(categoria.id).subscribe({
      next: (atualizada: CategoriaPadrao) => {
        this.exibirMensagem(
          atualizada.arquivada
            ? `"${atualizada.nome}" arquivada. Novas contas não a receberão.`
            : `"${atualizada.nome}" desarquivada.`,
        );
        this.loadCategorias();
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem('Erro ao alterar a categoria padrão.');
        console.error('Erro ao arquivar categoria padrão:', error);
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
