import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ParametroFiscal, ParametroFiscalRequest } from '../../../models/parametro-fiscal.model';
import { ParametroFiscalService } from '../../../services/parametro-fiscal.service';
import { deDataIso, paraDataIso } from '../../../utils/data';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';
import { ConfirmacaoService } from '../../../services/confirmacao.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-parametro-fiscal-form',
  styleUrl: './parametro-fiscal-form.css',
  templateUrl: './parametro-fiscal-form.html',
})
export class ParametroFiscalForm implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly form: FormGroup;
  private readonly location = inject(Location);

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    chave: {
      required: 'Chave é obrigatória.',
      pattern: 'Use de 2 a 60 caracteres: letras, números ou "_".',
    },
    valor: {
      required: 'Valor é obrigatório.',
      min: 'O valor não pode ser negativo.',
      pattern: 'Use no máximo 4 casas decimais.',
    },
    vigenciaInicio: {
      required: 'Início da vigência é obrigatório.',
      matDatepickerParse: 'Data inválida.',
    },
    vigenciaFim: {
      matDatepickerParse: 'Data inválida.',
      matDatepickerMin: 'O fim não pode ser anterior ao início.',
    },
  };

  constructor(
    private fb: FormBuilder,
    private parametroFiscalService: ParametroFiscalService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      chave: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]{2,60}$/)]],
      valor: [null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d{1,4})?$/)]],
      vigenciaInicio: [null, [Validators.required]],
      vigenciaFim: [null],
    });
  }

  ngOnInit(): void {
    const parametro = this.activatedRoute.snapshot.data['parametroFiscal'] as ParametroFiscal | undefined;

    if (parametro) {
      this.form.patchValue({
        id: parametro.id,
        chave: parametro.chave,
        valor: parametro.valor,
        vigenciaInicio: deDataIso(parametro.vigenciaInicio),
        vigenciaFim: deDataIso(parametro.vigenciaFim),
      });
    }
  }

  // o datepicker do fim nao deixa escolher data anterior ao inicio
  get inicioSelecionado(): Date | null {
    return this.form.get('vigenciaInicio')?.value ?? null;
  }

  // a chave e salva em maiusculas no back; o form ja mostra assim enquanto digita
  normalizarChave(): void {
    const control = this.form.get('chave');
    if (!control) return;

    const normalizada = String(control.value ?? '').toUpperCase().replace(/\s/g, '_');
    if (normalizada !== control.value) {
      control.setValue(normalizada);
    }
  }

  limparFim(): void {
    this.form.get('vigenciaFim')?.setValue(null);
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
      ? this.parametroFiscalService.update(id, payload)
      : this.parametroFiscalService.create(payload);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Parâmetro fiscal salvo com sucesso!');
        this.router.navigate(['/parametros-fiscais']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao salvar parâmetro fiscal.'));
        console.error('Erro ao salvar parâmetro fiscal:', error);
      },
    });
  }

  async excluir(): Promise<void> {
    const id = this.form.get('id')?.value as number | null;
    if (!id) return;

    if (!(await this.confirmacao.confirmar({ titulo: 'Excluir parâmetro fiscal', mensagem: 'Deseja realmente excluir este parâmetro fiscal? Esta ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true }))) return;

    this.parametroFiscalService.delete(id).subscribe({
      next: () => {
        this.exibirMensagem('Parâmetro fiscal excluído com sucesso!');
        this.router.navigate(['/parametros-fiscais']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao excluir parâmetro fiscal.'));
        console.error('Erro ao excluir parâmetro fiscal:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): ParametroFiscalRequest {
    const value = this.form.getRawValue();

    return {
      chave: String(value.chave).trim().toUpperCase(),
      valor: Number(value.valor),
      vigenciaInicio: paraDataIso(value.vigenciaInicio) as string,
      vigenciaFim: paraDataIso(value.vigenciaFim),
    };
  }

  private exibirMensagem(mensagem: string): void {
    this.snack.open(mensagem, 'Ok', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
