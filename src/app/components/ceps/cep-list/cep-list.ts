import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import {
  CepLocal,
  ORIGEM_MANUAL,
  ORIGENS_CEP,
  SITUACAO_DIVERGENTE,
  SITUACAO_NAO_VERIFICADO,
  SITUACAO_VERIFICADO,
  SITUACOES_CEP,
  UFS,
  formatarCep,
} from '../../../models/endereco-cliente.model';
import { CepAdminService } from '../../../services/cep-admin.service';
import { ConfirmacaoService } from '../../../services/confirmacao.service';
import { CepImportacaoDialog } from '../cep-importacao-dialog/cep-importacao-dialog';
import { CepRevisaoDialog } from '../cep-revisao-dialog/cep-revisao-dialog';

type Atalho = 'todos' | 'revisar' | 'divergentes';

// Base propria de CEPs de clientes: revisao, verificacao, revalidacao com o ViaCEP, importacao CSV e o
// interruptor da consulta externa (vale na hora, sem reiniciar o back). Tudo auditado no back.
@Component({
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  selector: 'app-cep-list',
  styleUrl: './cep-list.css',
  templateUrl: './cep-list.html',
})
export class CepList implements OnInit {
  private readonly cepService = inject(CepAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly snack = inject(MatSnackBar);

  readonly origens = ORIGENS_CEP;
  readonly situacoes = SITUACOES_CEP;
  readonly ufs = UFS;
  readonly formatarCep = formatarCep;
  readonly VERIFICADO = SITUACAO_VERIFICADO;
  readonly DIVERGENTE = SITUACAO_DIVERGENTE;

  displayedColumns: string[] = ['cep', 'endereco', 'municipio', 'origem', 'situacao', 'atualizado', 'acao'];
  dataSource = new MatTableDataSource<CepLocal>();
  pageIndex = 0;
  pageSize = 10;
  totalItems = 0;

  readonly apiLigada = signal<boolean | null>(null);
  readonly ocupado = signal(false);
  atalho: Atalho = 'todos';
  cepFilter = '';
  idOrigem: number | null = null;
  idSituacao: number | null = null;
  uf: string | null = null;
  private readonly cepChanges = new Subject<string>();

  ngOnInit(): void {
    this.cepService.configuracao().subscribe({
      next: (config) => this.apiLigada.set(config.apiExternaHabilitada),
      error: (error: unknown) => console.error('Erro ao buscar a configuração de CEP:', error),
    });
    this.carregar();
    this.cepChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.filtrar());
  }

  carregar(): void {
    this.cepService.findAll(this.pageIndex, this.pageSize, {
      cep: this.cepFilter, idOrigem: this.idOrigem, idSituacao: this.idSituacao, uf: this.uf,
    }).subscribe({
      next: (response) => {
        this.dataSource.data = response.items;
        this.pageIndex = response.page;
        this.pageSize = response.pageSize;
        this.totalItems = response.totalItems;
      },
      error: (error: unknown) => console.error('Erro ao buscar CEPs:', error),
    });
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregar();
  }

  onCepInput(valor: string): void {
    this.cepFilter = valor;
    this.cepChanges.next(valor);
  }

  // "Para revisar" = manuais nao verificados; "Divergentes" = revalidacao achou diferenca
  escolherAtalho(atalho: Atalho): void {
    this.atalho = atalho;
    this.idOrigem = atalho === 'revisar' ? ORIGEM_MANUAL : null;
    this.idSituacao = atalho === 'revisar' ? SITUACAO_NAO_VERIFICADO : atalho === 'divergentes' ? SITUACAO_DIVERGENTE : null;
    this.filtrar();
  }

  onFiltroManual(): void {
    this.atalho = 'todos';
    this.filtrar();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.carregar();
  }

  alternarApi(evento: MatSlideToggleChange): void {
    this.cepService.definirApiExterna(evento.checked).subscribe({
      next: (config) => {
        this.apiLigada.set(config.apiExternaHabilitada);
        this.avisar(config.apiExternaHabilitada
          ? 'Consulta externa ligada: CEPs fora da base serão buscados no ViaCEP.'
          : 'Consulta externa desligada: o cadastro usa só a base local e o modo manual.');
      },
      error: (error: HttpErrorResponse) => {
        evento.source.checked = !evento.checked;
        this.avisarErro(error, 'Não foi possível alterar a consulta externa.');
      },
    });
  }

  revisar(cep: CepLocal): void {
    this.dialog.open(CepRevisaoDialog, {
      data: { cep, apiLigada: this.apiLigada() === true },
      width: '640px',
      maxWidth: '95vw',
      autoFocus: false,
    }).afterClosed().subscribe((salvo?: CepLocal) => {
      if (!salvo) return;
      this.avisar(`CEP ${formatarCep(salvo.cep)} ${salvo.situacao.id === SITUACAO_VERIFICADO ? 'corrigido e verificado' : 'corrigido'}.`);
      this.carregar();
    });
  }

  verificar(cep: CepLocal): void {
    this.cepService.verificar(cep.id).subscribe({
      next: () => {
        this.avisar(`CEP ${formatarCep(cep.cep)} marcado como verificado.`);
        this.carregar();
      },
      error: (error: HttpErrorResponse) => this.avisarErro(error, 'Não foi possível verificar o CEP.'),
    });
  }

  revalidar(cep: CepLocal): void {
    this.ocupado.set(true);
    this.cepService.revalidar(cep.id).subscribe({
      next: (atualizado) => {
        this.ocupado.set(false);
        this.avisar(atualizado.situacao.id === SITUACAO_VERIFICADO
          ? `CEP ${formatarCep(cep.cep)} confere com o ViaCEP: verificado.`
          : `CEP ${formatarCep(cep.cep)} diverge do ViaCEP. Abra a revisão para ver a diferença.`);
        this.carregar();
      },
      error: (error: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.avisarErro(error, 'Não foi possível revalidar o CEP.');
      },
    });
  }

  async revalidarManuais(): Promise<void> {
    if (!(await this.confirmacao.confirmar({
      titulo: 'Revalidar CEPs manuais',
      mensagem: 'Todos os CEPs manuais ainda não verificados serão conferidos com o ViaCEP. Os que baterem ficam '
        + 'verificados; os outros, divergentes.',
      confirmar: 'Revalidar',
      icone: 'sync',
    }))) return;

    this.ocupado.set(true);
    this.cepService.revalidarManuais().subscribe({
      next: (r) => {
        this.ocupado.set(false);
        this.avisar(r.conferidos === 0 ? 'Nenhum CEP manual aguardando conferência.'
          : `${r.conferidos} conferido(s): ${r.verificados} verificado(s), ${r.divergentes} divergente(s)`
            + (r.falhas ? `, ${r.falhas} falha(s) na consulta.` : '.'));
        this.carregar();
      },
      error: (error: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.avisarErro(error, 'Não foi possível revalidar os CEPs.');
      },
    });
  }

  importar(input: HTMLInputElement): void {
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo) return;
    if (arquivo.size > 1024 * 1024) {
      this.avisar('O arquivo pode ter no máximo 1 MB.');
      return;
    }
    this.ocupado.set(true);
    this.cepService.importar(arquivo).subscribe({
      next: (resultado) => {
        this.ocupado.set(false);
        this.dialog.open(CepImportacaoDialog, { data: resultado, width: '640px', maxWidth: '95vw' });
        this.carregar();
      },
      error: (error: HttpErrorResponse) => {
        this.ocupado.set(false);
        this.avisarErro(error, 'Não foi possível importar o arquivo.');
      },
    });
  }

  tomSituacao(cep: CepLocal): string {
    return cep.situacao.id === SITUACAO_VERIFICADO ? 'tag-ok' : cep.situacao.id === SITUACAO_DIVERGENTE ? 'tag-erro' : 'tag-alerta';
  }

  private avisarErro(error: HttpErrorResponse, padrao: string): void {
    const problem = error.error as ApiProblem | null;
    this.avisar(problem?.errors?.[0]?.message ?? problem?.detail ?? padrao);
  }

  private avisar(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', { duration: 5000 });
  }
}
