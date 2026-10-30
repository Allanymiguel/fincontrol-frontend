import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe, Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Cupom, CupomRequest } from '../../../models/cupom.model';
import { Plano } from '../../../models/plano.model';
import { CupomService } from '../../../services/cupom.service';
import { PlanoService } from '../../../services/plano.service';
import { deDataIso, paraDataIso } from '../../../utils/data';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';
import { ConfirmacaoService } from '../../../services/confirmacao.service';

@Component({
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  selector: 'app-cupom-form',
  styleUrl: './cupom-form.css',
  templateUrl: './cupom-form.html',
})
export class CupomForm implements OnInit {
  private readonly confirmacao = inject(ConfirmacaoService);
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
    limiteUsos: {
      min: 'O limite deve ser pelo menos 1 (deixe vazio para não limitar).',
      pattern: 'Use um número inteiro.',
    },
  };

  // planos pagos (o Gratuito nao tem preco para descontar)
  readonly planos = signal<Plano[]>([]);
  // metricas do cupom em edicao (nulo no cupom novo)
  readonly metricas = signal<Cupom | null>(null);
  private readonly planoService = inject(PlanoService);

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
      limiteUsos: [null as number | null, [Validators.min(1), Validators.pattern(/^\d+$/)]],
      idPlanos: [[] as number[]],
    });
  }

  ngOnInit(): void {
    const cupom = this.activatedRoute.snapshot.data['cupom'] as Cupom | undefined;
    // so planos com preco; os ja escolhidos continuam na lista mesmo se forem desativados depois
    this.planoService.findAll(0, 100).subscribe({
      next: (resposta) => this.planos.set(resposta.items.filter((plano) => plano.precoMensal > 0
        && (plano.ativo || cupom?.planos.some((p) => p.id === plano.id)))),
      error: (error: unknown) => console.error('Erro ao buscar planos:', error),
    });

    if (cupom) {
      this.form.patchValue({ ...cupom, validade: deDataIso(cupom.validade), idPlanos: cupom.planos.map((p) => p.id) });
      this.metricas.set(cupom);
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

  async excluir(): Promise<void> {
    const id = this.form.get('id')?.value as number | null;
    if (!id) return;

    if (!(await this.confirmacao.confirmar({ titulo: 'Excluir cupom', mensagem: 'Deseja realmente excluir este cupom? Esta ação não pode ser desfeita.', confirmar: 'Excluir', perigo: true }))) return;

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
      limiteUsos: value.limiteUsos === null || value.limiteUsos === '' ? null : Number(value.limiteUsos),
      idPlanos: value.idPlanos ?? [],
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
