import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TransacaoService } from '../../../services/transacao.service';
import { Categoria } from '../../../models/categoria.model';
import { CategoriaService } from '../../../services/categoria.service';
import { TIPOS_TRANSACAO, TIPO_TRANSACAO_LABELS } from '../../../models/tipo-transacao';
import { ESCOPOS_TRANSACAO, ESCOPO_TRANSACAO_LABELS } from '../../../models/escopo-transacao';

@Component({
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule,
            MatInputModule, MatButtonModule, MatToolbarModule,
            MatSelectModule, MatIconModule, MatSnackBarModule],
  selector: 'app-transacao-form',
  styleUrl: './transacao-form.css',
  templateUrl: './transacao-form.html',
})
export class TransacaoForm implements OnInit {

  readonly form: FormGroup;
  private readonly location = inject(Location);
  categorias: Categoria[] = [];
  readonly tipos = TIPOS_TRANSACAO;
  readonly tipoLabels = TIPO_TRANSACAO_LABELS;
  readonly escopos = ESCOPOS_TRANSACAO;
  readonly escopoLabels = ESCOPO_TRANSACAO_LABELS;

  constructor(
    private fb: FormBuilder,
    private transacaoService: TransacaoService,
    private categoriaService: CategoriaService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router
  ) {
    this.form = this.fb.group({
      id: [null],
      descricao: [''],
      valor: [null],
      data: [''],
      tipo: [''],
      escopo: [''],
      idCategoria: [null]
    });
  }

  ngOnInit(): void {
    const transacao = this.activatedRoute.snapshot.data['transacao'];

    if (transacao) {
      this.form.patchValue(transacao);
    }

    this.categoriaService.findAll().subscribe({
      next: (categorias) => {
        this.categorias = categorias;

        if (transacao) {
          this.form.patchValue({ idCategoria: transacao.categoria.id });
        }
      },
      error: (error) => {
        console.error('Erro ao buscar categorias:', error);
      }
    });
  }

  salvar() {
    const transacao = this.form.value;

    let resultado: Observable<unknown> = (transacao.id) ?
      this.transacaoService.update(transacao.id, transacao) :
      this.transacaoService.create(transacao);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Transação salva com sucesso!');
        this.router.navigate(['/transacoes']);
      },
      error: (error) => {
        this.exibirMensagem('Erro ao salvar transação!');
        console.error('Erro ao salvar transação:', error);
      }
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
        error: (error) => {
          this.exibirMensagem('Erro ao excluir transação!');
          console.error('Erro ao excluir transação:', error);
        }
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
}
