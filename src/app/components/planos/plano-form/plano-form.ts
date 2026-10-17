import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Plano, PlanoRequest } from '../../../models/plano.model';
import { PlanoService } from '../../../services/plano.service';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';
import { ConfirmacaoService } from '../../../services/confirmacao.service';

// inteiro sem sinal: os limites nao aceitam negativo nem casas decimais
const INTEIRO = /^\d+$/;
// valor monetario com ate 2 casas decimais
const DINHEIRO = /^\d+(\.\d{1,2})?$/;

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-plano-form',
  styleUrl: './plano-form.css',
  templateUrl: './plano-form.html',
})
export class PlanoForm implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly form: FormGroup;
  private readonly location = inject(Location);

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    nome: {
      required: 'Nome é obrigatório.',
      minlength: 'Nome deve ter ao menos 2 caracteres.',
      maxlength: 'Nome deve ter no máximo 60 caracteres.',
    },
    precoMensal: {
      required: 'Preço mensal é obrigatório.',
      min: 'Preço mensal não pode ser negativo.',
      pattern: 'Use no máximo 2 casas decimais.',
    },
    precoAnual: {
      required: 'Preço anual é obrigatório.',
      min: 'Preço anual não pode ser negativo.',
      pattern: 'Use no máximo 2 casas decimais.',
    },
    limiteTransacoes: {
      required: 'Limite de transações é obrigatório.',
      pattern: 'Informe um número inteiro maior ou igual a zero.',
    },
    limiteMetas: {
      required: 'Limite de metas é obrigatório.',
      pattern: 'Informe um número inteiro maior ou igual a zero.',
    },
  };

  constructor(
    private fb: FormBuilder,
    private planoService: PlanoService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      // 0 e aceito: e o plano Gratuito que toda conta nova recebe (RN13)
      precoMensal: [null, [Validators.required, Validators.min(0), Validators.pattern(DINHEIRO)]],
      precoAnual: [null, [Validators.required, Validators.min(0), Validators.pattern(DINHEIRO)]],
      limiteTransacoes: [null, [Validators.required, Validators.pattern(INTEIRO)]],
      limiteMetas: [null, [Validators.required, Validators.pattern(INTEIRO)]],
      liberaRecorrencias: [false],
      liberaFiscal: [false],
      liberaExportacao: [false],
      ativo: [true],
    });
  }

  ngOnInit(): void {
    const plano = this.activatedRoute.snapshot.data['plano'] as Plano | undefined;

    if (plano) {
      this.form.patchValue(plano);
    }
  }

  salvar(): void {
    limparErrosDaApi(this.form);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.exibirMensagem('Corrija os campos destacados antes de salvar.');
      return;
    }

    const id = this.form.get('id')?.value as number | null;
    const payload = this.toRequest();

    const resultado: Observable<unknown> = id
      ? this.planoService.update(id, payload)
      : this.planoService.create(payload);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Plano salvo com sucesso!');
        this.router.navigate(['/planos']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao salvar plano.'));
        console.error('Erro ao salvar plano:', error);
      },
    });
  }

  async excluir(): Promise<void> {
    const id = this.form.get('id')?.value as number | null;
    if (!id) return;

    if (!(await this.confirmacao.confirmar({ titulo: 'Excluir plano', mensagem: 'Deseja realmente excluir este plano? Esta ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true }))) return;

    this.planoService.delete(id).subscribe({
      next: () => {
        this.exibirMensagem('Plano excluído com sucesso!');
        this.router.navigate(['/planos']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao excluir plano.'));
        console.error('Erro ao excluir plano:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): PlanoRequest {
    const value = this.form.getRawValue();

    return {
      nome: String(value.nome).trim(),
      precoMensal: Number(value.precoMensal),
      precoAnual: Number(value.precoAnual),
      limiteTransacoes: Number(value.limiteTransacoes),
      limiteMetas: Number(value.limiteMetas),
      liberaRecorrencias: !!value.liberaRecorrencias,
      liberaFiscal: !!value.liberaFiscal,
      liberaExportacao: !!value.liberaExportacao,
      ativo: !!value.ativo,
    };
  }

  private exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }
}
