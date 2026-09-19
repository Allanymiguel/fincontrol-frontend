import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Categoria } from '../../../models/categoria.model';
import { ESCOPOS_TRANSACAO, EscopoTransacao } from '../../../models/escopo-transacao';
import { TIPOS_TRANSACAO, TipoTransacao } from '../../../models/tipo-transacao';
import { CategoriaService, PagedResponse } from '../../../services/categoria.service';
import { TransacaoService } from '../../../services/transacao.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-transacao-form',
  styleUrl: './transacao-form.css',
  templateUrl: './transacao-form.html',
})
export class TransacaoForm implements OnInit {
  readonly form: FormGroup;
  private readonly location = inject(Location);

  tipos: TipoTransacao[] = TIPOS_TRANSACAO;
  escopos: EscopoTransacao[] = ESCOPOS_TRANSACAO;
  categorias: Categoria[] = [];

  constructor(
    private fb: FormBuilder,
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      descricao: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      data: [null, Validators.required],
      idTipo: [null, Validators.required],
      idEscopo: [null, Validators.required],
      idCategoria: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    const transacao = this.activatedRoute.snapshot.data['transacao'];

    if (transacao) {
      this.form.patchValue({
        ...transacao,
        idTipo: transacao.tipo?.id,
        idEscopo: transacao.escopo?.id,
        idCategoria: transacao.categoria?.id,
      });
    }

    this.categoriaService.findAll(0, 1000).subscribe({
      next: (response: PagedResponse<Categoria>) => (this.categorias = response.items),
      error: (error: unknown) => console.error('Erro ao buscar categorias:', error),
    });
  }

  salvar() {
    const transacao = { ...this.form.value };
    transacao.data = this.formatarData(transacao.data);

    const resultado = transacao.id
      ? this.transacaoService.update(transacao.id, transacao)
      : this.transacaoService.create(transacao);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Transação salva com sucesso!');
        this.router.navigate(['/transacoes']);
      },
      error: (error: unknown) => {
        this.exibirMensagem('Erro ao salvar transação!');
        console.error('Erro ao salvar transação:', error);
      },
    });
  }

  excluir() {
    const transacao = this.form.value;

    if (transacao.id) {
      this.transacaoService.delete(transacao.id).subscribe({
        next: () => {
          this.exibirMensagem('Transação excluída com sucesso!');
          this.router.navigate(['/transacoes']);
        },
        error: (error: unknown) => {
          this.exibirMensagem('Erro ao excluir transação!');
          console.error('Erro ao excluir transação:', error);
        },
      });
    }
  }

  exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  voltar(): void {
    this.location.back();
  }

  private formatarData(data: string | Date | null): string | null {
    if (!data) return null;
    if (typeof data === 'string') return data.substring(0, 10);
    const yyyy = data.getFullYear();
    const mm = String(data.getMonth() + 1).padStart(2, '0');
    const dd = String(data.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
