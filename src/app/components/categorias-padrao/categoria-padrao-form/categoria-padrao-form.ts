import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CategoriaPadrao, CategoriaPadraoRequest } from '../../../models/categoria-padrao.model';
import { TIPOS_TRANSACAO, TipoTransacao } from '../../../models/tipo-transacao';
import { CategoriaPadraoService } from '../../../services/categoria-padrao.service';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';

const COR_HEX = /^#[0-9A-Fa-f]{6}$/;

@Component({
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-categoria-padrao-form',
  styleUrl: './categoria-padrao-form.css',
  templateUrl: './categoria-padrao-form.html',
})
export class CategoriaPadraoForm implements OnInit {
  readonly form: FormGroup;
  private readonly location = inject(Location);
  tipos: TipoTransacao[] = TIPOS_TRANSACAO;
  // estado de arquivamento: so muda pelo botao Arquivar/Desarquivar (PATCH), nao pelo Salvar
  arquivada = false;

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    nome: {
      required: 'Nome é obrigatório.',
      minlength: 'Nome deve ter ao menos 2 caracteres.',
      maxlength: 'Nome deve ter no máximo 60 caracteres.',
    },
    idTipo: {
      required: 'Selecione o tipo.',
    },
    cor: {
      pattern: 'Use o formato #RRGGBB (ex.: #4F46E5).',
    },
  };

  constructor(
    private fb: FormBuilder,
    private categoriaPadraoService: CategoriaPadraoService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      idTipo: [null, [Validators.required]],
      cor: ['', [Validators.pattern(COR_HEX)]],
    });
  }

  ngOnInit(): void {
    const categoria = this.activatedRoute.snapshot.data['categoriaPadrao'] as CategoriaPadrao | undefined;

    if (categoria) {
      this.form.patchValue({
        id: categoria.id,
        nome: categoria.nome,
        idTipo: categoria.tipo?.id ?? null,
        cor: categoria.cor ?? '',
      });
      this.arquivada = categoria.arquivada;
    }
  }

  // cor valida para o seletor nativo (que nao aceita vazio nem formato invalido)
  get corDoSeletor(): string {
    const cor = this.form.get('cor')?.value as string;
    return COR_HEX.test(cor ?? '') ? cor : '#000000';
  }

  onCorSelecionada(cor: string): void {
    const control = this.form.get('cor');
    control?.setValue(cor.toUpperCase());
    control?.markAsTouched();
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
      ? this.categoriaPadraoService.update(id, payload)
      : this.categoriaPadraoService.create(payload);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Categoria padrão salva com sucesso!');
        this.router.navigate(['/categorias-padrao']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao salvar categoria padrão.'));
        console.error('Erro ao salvar categoria padrão:', error);
      },
    });
  }

  alternarArquivada(): void {
    const id = this.form.get('id')?.value as number | null;
    if (!id) return;

    this.categoriaPadraoService.alternarArquivada(id).subscribe({
      next: (atualizada: CategoriaPadrao) => {
        this.arquivada = atualizada.arquivada;
        this.exibirMensagem(atualizada.arquivada ? 'Categoria padrão arquivada.' : 'Categoria padrão desarquivada.');
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao alterar a categoria padrão.'));
        console.error('Erro ao arquivar categoria padrão:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): CategoriaPadraoRequest {
    const value = this.form.getRawValue();
    const cor = String(value.cor ?? '').trim();

    return {
      nome: String(value.nome).trim(),
      idTipo: Number(value.idTipo),
      cor: cor.length > 0 ? cor.toUpperCase() : null,
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
