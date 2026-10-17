import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import { Usuario } from '../../../models/usuario.model';
import { PagedResponse } from '../../../services/categoria.service';
import { UsuarioService } from '../../../services/usuario.service';
import { formatarDocumento } from '../../../utils/documento';

// Somente leitura + ativar/desativar: os usuarios serao criados pelo Keycloak
@Component({
  imports: [
    FormsModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    RouterLink,
  ],
  selector: 'app-usuario-list',
  styleUrl: './usuario-list.css',
  templateUrl: './usuario-list.html',
})
export class UsuarioList implements OnInit {
  displayedColumns: string[] = ['numero', 'nome', 'documento', 'perfil', 'cidade', 'papel', 'ativo'];
  dataSource = new MatTableDataSource<Usuario>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  buscaFilter = '';
  private readonly buscaChanges = new Subject<string>();
  // ids com PATCH em andamento: o toggle fica desabilitado ate a resposta
  readonly alterando = new Set<number>();

  readonly formatarDocumento = formatarDocumento;

  constructor(
    private usuarioService: UsuarioService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadUsuarios();

    this.buscaChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageIndex = 0;
      this.loadUsuarios();
    });
  }

  loadUsuarios() {
    this.usuarioService.findAll(this.pageIndex, this.pageSize, this.buscaFilter).subscribe({
      next: (response: PagedResponse<Usuario>) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar usuários:', error),
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsuarios();
  }

  onBuscaInput(value: string) {
    this.buscaFilter = value;
    this.buscaChanges.next(value);
  }

  limparFiltro() {
    this.buscaFilter = '';
    this.pageIndex = 0;
    this.loadUsuarios();
  }

  alternarAtivo(usuario: Usuario, event: MatSlideToggleChange) {
    this.alterando.add(usuario.id);

    this.usuarioService.alternarAtivo(usuario.id).subscribe({
      next: (atualizado: Usuario) => {
        this.alterando.delete(usuario.id);
        // troca so a linha alterada, sem recarregar a pagina
        this.dataSource.data = this.dataSource.data.map((u) => (u.id === atualizado.id ? atualizado : u));
        this.exibirMensagem(`${atualizado.nome} ${atualizado.ativo ? 'ativado' : 'desativado'}.`);
      },
      error: (error: HttpErrorResponse) => {
        this.alterando.delete(usuario.id);
        // desfaz a mudanca visual do toggle
        event.source.checked = usuario.ativo;
        // ex.: "Você não pode desativar a própria conta."
        const problem = error.error as ApiProblem | null;
        this.exibirMensagem(problem?.errors?.[0]?.message ?? problem?.detail ?? 'Erro ao alterar o usuário.');
        console.error('Erro ao ativar/desativar usuário:', error);
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
