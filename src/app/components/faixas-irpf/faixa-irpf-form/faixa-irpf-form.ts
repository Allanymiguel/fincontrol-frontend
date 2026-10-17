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
import { FaixaIrpf, FaixaIrpfRequest } from '../../../models/faixa-irpf.model';
import { FaixaIrpfService } from '../../../services/faixa-irpf.service';
import { deDataIso, paraDataIso } from '../../../utils/data';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';
import { ConfirmacaoService } from '../../../services/confirmacao.service';

// valor monetario/percentual com ate 2 casas decimais
const DUAS_CASAS = /^\d+(\.\d{1,2})?$/;

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
  selector: 'app-faixa-irpf-form',
  styleUrl: './faixa-irpf-form.css',
  templateUrl: './faixa-irpf-form.html',
})
export class FaixaIrpfForm implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly form: FormGroup;
  private readonly location = inject(Location);

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    vigenciaInicio: {
      required: 'Início da vigência é obrigatório.',
      matDatepickerParse: 'Data inválida.',
    },
    limiteInferior: {
      required: 'Limite inferior é obrigatório.',
      min: 'O limite inferior não pode ser negativo.',
      pattern: 'Use no máximo 2 casas decimais.',
    },
    limiteSuperior: {
      min: 'O limite superior não pode ser negativo.',
      pattern: 'Use no máximo 2 casas decimais.',
    },
    aliquota: {
      required: 'Alíquota é obrigatória.',
      min: 'A alíquota não pode ser negativa.',
      max: 'A alíquota deve ser no máximo 100%.',
      pattern: 'Use no máximo 2 casas decimais.',
    },
    parcelaDeduzir: {
      required: 'Parcela a deduzir é obrigatória.',
      min: 'A parcela a deduzir não pode ser negativa.',
      pattern: 'Use no máximo 2 casas decimais.',
    },
  };

  constructor(
    private fb: FormBuilder,
    private faixaIrpfService: FaixaIrpfService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      vigenciaInicio: [null, [Validators.required]],
      limiteInferior: [null, [Validators.required, Validators.min(0), Validators.pattern(DUAS_CASAS)]],
      limiteSuperior: [null, [Validators.min(0), Validators.pattern(DUAS_CASAS)]],
      aliquota: [null, [Validators.required, Validators.min(0), Validators.max(100), Validators.pattern(DUAS_CASAS)]],
      parcelaDeduzir: [null, [Validators.required, Validators.min(0), Validators.pattern(DUAS_CASAS)]],
    });
  }

  ngOnInit(): void {
    const faixa = this.activatedRoute.snapshot.data['faixaIrpf'] as FaixaIrpf | undefined;

    if (faixa) {
      this.form.patchValue({ ...faixa, vigenciaInicio: deDataIso(faixa.vigenciaInicio) });
      return;
    }

    // nova faixa a partir de uma tabela filtrada na listagem: ja vem com a vigencia dela
    const vigencia = this.activatedRoute.snapshot.queryParamMap.get('vigencia');
    if (vigencia) {
      this.form.patchValue({ vigenciaInicio: deDataIso(vigencia) });
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
      ? this.faixaIrpfService.update(id, payload)
      : this.faixaIrpfService.create(payload);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Faixa do IRPF salva com sucesso!');
        this.router.navigate(['/faixas-irpf']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao salvar faixa do IRPF.'));
        console.error('Erro ao salvar faixa do IRPF:', error);
      },
    });
  }

  async excluir(): Promise<void> {
    const id = this.form.get('id')?.value as number | null;
    if (!id) return;

    if (!(await this.confirmacao.confirmar({ titulo: 'Excluir faixa do IRPF', mensagem: 'Deseja realmente excluir esta faixa do IRPF? Esta ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true }))) return;

    this.faixaIrpfService.delete(id).subscribe({
      next: () => {
        this.exibirMensagem('Faixa do IRPF excluída com sucesso!');
        this.router.navigate(['/faixas-irpf']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao excluir faixa do IRPF.'));
        console.error('Erro ao excluir faixa do IRPF:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): FaixaIrpfRequest {
    const value = this.form.getRawValue();
    const semSuperior = value.limiteSuperior === null || value.limiteSuperior === '';

    return {
      vigenciaInicio: paraDataIso(value.vigenciaInicio) as string,
      limiteInferior: Number(value.limiteInferior),
      limiteSuperior: semSuperior ? null : Number(value.limiteSuperior),
      aliquota: Number(value.aliquota),
      parcelaDeduzir: Number(value.parcelaDeduzir),
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
