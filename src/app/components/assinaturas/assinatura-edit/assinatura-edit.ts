import { DatePipe, DecimalPipe, Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiProblem } from '../../../models/api-problem.model';
import { Assinatura, AssinaturaUpdate } from '../../../models/assinatura.model';
import { STATUS_ASSINATURA, StatusAssinatura } from '../../../models/status-assinatura';
import { AssinaturaService } from '../../../services/assinatura.service';
import { deDataIso, paraDataIso } from '../../../utils/data';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';

// id 3 = CANCELADA (enum StatusAssinatura do back)
const STATUS_CANCELADA = 3;

// Edicao de assinatura: usuario, plano, cupom e valor sao fixos (para trocar de plano,
// cancela-se esta e cria-se outra); aqui mudam so status, data de fim e observacao.
@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-assinatura-edit',
  styleUrl: './assinatura-edit.css',
  templateUrl: './assinatura-edit.html',
})
export class AssinaturaEdit implements OnInit {
  readonly form: FormGroup;
  private readonly location = inject(Location);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly assinaturaService = inject(AssinaturaService);

  readonly status: StatusAssinatura[] = STATUS_ASSINATURA;
  readonly assinatura = signal<Assinatura | null>(null);
  // o fim nao pode ser antes do inicio
  dataInicio: Date | null = null;

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    idStatus: { required: 'Selecione o status.' },
    dataFim: {
      matDatepickerParse: 'Data inválida.',
      matDatepickerMin: 'O fim não pode ser anterior ao início.',
    },
    observacao: { maxlength: 'A observação deve ter no máximo 255 caracteres.' },
  };

  constructor(
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private router: Router,
  ) {
    this.form = this.fb.group({
      idStatus: [null as number | null, [Validators.required]],
      dataFim: [null as Date | null],
      observacao: ['', [Validators.maxLength(255)]],
    });
  }

  ngOnInit(): void {
    const assinatura = this.activatedRoute.snapshot.data['assinatura'] as Assinatura;
    this.assinatura.set(assinatura);
    this.dataInicio = deDataIso(assinatura.dataInicio);

    this.form.patchValue({
      idStatus: assinatura.status.id,
      dataFim: deDataIso(assinatura.dataFim),
      observacao: assinatura.observacao ?? '',
    });
  }

  isCancelada(): boolean {
    return this.assinatura()?.status.id === STATUS_CANCELADA;
  }

  limparFim(): void {
    this.form.get('dataFim')?.setValue(null);
  }

  salvar(): void {
    limparErrosDaApi(this.form);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.exibirMensagem('Corrija os campos destacados antes de salvar.');
      return;
    }

    this.assinaturaService.update(this.assinatura()!.id, this.toUpdate()).subscribe({
      next: () => {
        this.exibirMensagem('Assinatura salva com sucesso!');
        this.router.navigate(['/assinaturas']);
      },
      error: (error: HttpErrorResponse) => {
        // a regra "uma ativa por usuario" vem no campo idUsuario, que nao existe aqui: mostra no status
        const problem = error.error as ApiProblem | null;
        problem?.errors?.forEach((e) => {
          if (e.field === 'idUsuario') e.field = 'idStatus';
        });
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao salvar assinatura.'));
        console.error('Erro ao salvar assinatura:', error);
      },
    });
  }

  cancelarAssinatura(): void {
    const assinatura = this.assinatura();
    if (!assinatura || !confirm('Deseja realmente cancelar esta assinatura?')) return;

    this.assinaturaService.cancelar(assinatura.id).subscribe({
      next: () => {
        this.exibirMensagem('Assinatura cancelada.');
        this.router.navigate(['/assinaturas']);
      },
      error: (error: HttpErrorResponse) => {
        this.exibirMensagem(aplicarErrosDaApi(this.form, error, 'Erro ao cancelar assinatura.'));
        console.error('Erro ao cancelar assinatura:', error);
      },
    });
  }

  voltar(): void {
    this.location.back();
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toUpdate(): AssinaturaUpdate {
    const value = this.form.getRawValue();
    const observacao = String(value.observacao ?? '').trim();

    return {
      idStatus: Number(value.idStatus),
      dataFim: paraDataIso(value.dataFim),
      observacao: observacao.length > 0 ? observacao : null,
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
