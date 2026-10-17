import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cupom, CupomRequest } from '../../../models/cupom.model';
import { CupomService } from '../../../services/cupom.service';
import { deDataIso, paraDataIso } from '../../../utils/data';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';

@Component({
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-cupom-form',
  styleUrl: './cupom-form.css',
  templateUrl: './cupom-form.html',
})
export class CupomForm implements OnInit {
  readonly form: FormGroup;
  private readonly location = inject(Location);

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    codigo: {
      required: 'Código é obrigatório.',
      pattern: 'Use de 3 a 30 caracteres: letras, números, "-" ou "_".',
    },
    percentualDesconto: {
      required: 'Percentual de desconto é obrigatório.',
      min: 'O desconto deve ser maior que zero.',
      max: 'O desconto deve ser no máximo 100%.',
      pattern: 'Use no máximo 2 casas decimais.',
    },
    validade: {
      required: 'Validade é obrigatória.',
      matDatepickerParse: 'Data inválida.',
    },
  };

  constructor(
    private fb: FormBuilder,
    private cupomService: CupomService,
    private activatedRoute: ActivatedRoute,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      id: [null],
      codigo: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_-]{3,30}$/)]],
      percentualDesconto: [
        null,
        [Validators.required, Validators.min(0.01), Validators.max(100), Validators.pattern(/^\d+(\.\d{1,2})?$/)],
      ],
      validade: [null, [Validators.required]],
      ativo: [true],
    });
  }

  ngOnInit(): void {
    const cupom = this.activatedRoute.snapshot.data['cupom'] as Cupom | undefined;

    if (cupom) {
      this.form.patchValue({ ...cupom, validade: deDataIso(cupom.validade) });
    }
  }

  // o back salva o codigo em maiusculas; o form ja mostra assim enquanto digita
  normalizarCodigo(): void {
    const control = this.form.get('codigo');
    if (!control) return;

    const normalizado = String(control.value ?? '').toUpperCase().replace(/\s/g, '');
    if (normalizado !== control.value) {
      control.setValue(normalizado);
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
      ? this.cupomService.update(id, payload)
      : this.cupomService.create(payload);

    resultado.subscribe({
      next: () => {
        this.exibirMensagem('Cupom salvo com sucesso!');
        this.router.navigate(['/cupons']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao salvar cupom.'));
        console.error('Erro ao salvar cupom:', error);
      },
    });
  }

  excluir(): void {
    const id = this.form.get('id')?.value as number | null;
    if (!id) return;

    if (!confirm('Deseja realmente excluir este cupom?')) return;

    this.cupomService.delete(id).subscribe({
      next: () => {
        this.exibirMensagem('Cupom excluído com sucesso!');
        this.router.navigate(['/cupons']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao excluir cupom.'));
        console.error('Erro ao excluir cupom:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): CupomRequest {
    const value = this.form.getRawValue();

    return {
      codigo: String(value.codigo).trim().toUpperCase(),
      percentualDesconto: Number(value.percentualDesconto),
      validade: paraDataIso(value.validade) as string,
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
