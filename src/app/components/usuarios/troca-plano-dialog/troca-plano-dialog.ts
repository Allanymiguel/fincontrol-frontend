import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { catchError, debounceTime, map, of, startWith, switchMap, tap } from 'rxjs';
import { ApiProblem } from '../../../models/api-problem.model';
import {
  Assinatura,
  EFEITO_AGENDADO,
  EFEITO_DESFAZ_AGENDAMENTO,
  EFEITO_IMEDIATO,
  TrocaPlanoRequest,
  TrocaPlanoResultado,
} from '../../../models/assinatura.model';
import { Cupom } from '../../../models/cupom.model';
import { FORMAS_PAGAMENTO, FORMA_PAGAMENTO_NENHUMA } from '../../../models/forma-pagamento';
import { PERIODICIDADES } from '../../../models/periodicidade';
import { Plano } from '../../../models/plano.model';
import { AssinaturaService } from '../../../services/assinatura.service';
import { CupomService } from '../../../services/cupom.service';
import { PlanoService } from '../../../services/plano.service';
import { hojeIso } from '../../../utils/data';
import { aplicarErrosDaApi, limparErrosDaApi, mensagemDeErro } from '../../../utils/form-errors';

export interface DadosTrocaPlano {
  assinatura: Assinatura;
}

// Previa vinda do back: o resultado ou a mensagem de por que a troca nao vale
type Previa = { resultado: TrocaPlanoResultado; erro: null } | { resultado: null; erro: string };

// Troca de plano pelo admin (RN16, no estilo da Netflix). O efeito (vale agora ou fica agendada),
// o credito e a data da proxima cobranca vem da simulacao do back, conforme o admin escolhe.
// Fecha com o TrocaPlanoResultado quando a troca e feita.
@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  selector: 'app-troca-plano-dialog',
  styleUrl: './troca-plano-dialog.css',
  templateUrl: './troca-plano-dialog.html',
})
export class TrocaPlanoDialog implements OnInit {
  private readonly dados = inject<DadosTrocaPlano>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TrocaPlanoDialog, TrocaPlanoResultado>);
  private readonly assinaturaService = inject(AssinaturaService);
  private readonly planoService = inject(PlanoService);
  private readonly cupomService = inject(CupomService);

  readonly assinatura = this.dados.assinatura;
  readonly periodicidades = PERIODICIDADES;
  readonly EFEITO_IMEDIATO = EFEITO_IMEDIATO;
  readonly EFEITO_AGENDADO = EFEITO_AGENDADO;
  readonly EFEITO_DESFAZ = EFEITO_DESFAZ_AGENDAMENTO;

  // so o que pode ser contratado: planos ativos (mais o vigente) e cupons ativos dentro da validade
  readonly planos = signal<Plano[]>([]);
  readonly cupons = signal<Cupom[]>([]);
  readonly enviando = signal(false);

  readonly form = inject(FormBuilder).group({
    idPlano: [this.assinatura.idPlano as number | null, Validators.required],
    idPeriodicidade: [this.assinatura.periodicidade.id as number | null, Validators.required],
    idCupom: [this.assinatura.idCupom],
    idFormaPagamento: [this.assinatura.formaPagamento.id === FORMA_PAGAMENTO_NENHUMA ? null : this.assinatura.formaPagamento.id],
  });

  private readonly valores = toSignal(this.form.valueChanges.pipe(startWith(this.form.getRawValue())), {
    initialValue: this.form.getRawValue(),
  });

  // plano sem custo (Gratuito ou cupom de 100%): nao ha forma de pagamento
  readonly semCusto = computed(() => {
    const valores = this.valores();
    const plano = this.planos().find((p) => p.id === valores.idPlano);
    if (!plano) return false;
    const preco = valores.idPeriodicidade === 2 ? plano.precoAnual : plano.precoMensal;
    const cupom = this.cupons().find((c) => c.id === valores.idCupom);
    return preco === 0 || cupom?.percentualDesconto === 100;
  });

  readonly formasPagamento = FORMAS_PAGAMENTO.filter((f) => f.id !== FORMA_PAGAMENTO_NENHUMA);

  readonly previa = signal<Previa | null>(null);

  readonly rotuloConfirmar = computed(() => {
    switch (this.previa()?.resultado?.efeito.id) {
      case EFEITO_IMEDIATO:
        return 'Trocar agora';
      case EFEITO_AGENDADO:
        return 'Agendar troca';
      case EFEITO_DESFAZ_AGENDAMENTO:
        return 'Desfazer agendamento';
      default:
        return 'Trocar plano';
    }
  });

  private readonly fieldMessages: Record<string, Record<string, string>> = {
    idPlano: { required: 'Selecione o plano.' },
    idPeriodicidade: { required: 'Selecione a periodicidade.' },
  };

  ngOnInit(): void {
    const hoje = hojeIso();
    this.planoService.findAll(0, 100).subscribe({
      next: (response) =>
        this.planos.set(response.items.filter((p) => p.ativo || p.id === this.assinatura.idPlano)),
      error: (error: unknown) => console.error('Erro ao buscar planos:', error),
    });
    this.cupomService.findAll(0, 100).subscribe({
      next: (response) =>
        this.cupons.set(
          response.items.filter((c) => (c.ativo && c.validade >= hoje) || c.id === this.assinatura.idCupom),
        ),
      error: (error: unknown) => console.error('Erro ao buscar cupons:', error),
    });

    // a cada escolha, o back diz o que aconteceria (sem alterar nada)
    this.form.valueChanges
      .pipe(
        startWith(this.form.getRawValue()),
        // enquanto recalcula, a previa antiga some e o botao de confirmar fica desabilitado
        tap(() => this.previa.set(null)),
        debounceTime(250),
        switchMap(() => {
          if (this.form.invalid) return of(null);
          return this.assinaturaService.simularTroca(this.assinatura.idUsuario, this.toRequest()).pipe(
            map((resultado): Previa => ({ resultado, erro: null })),
            catchError((error: HttpErrorResponse) => of<Previa>({ resultado: null, erro: this.mensagemDaApi(error) })),
          );
        }),
      )
      .subscribe((previa) => this.previa.set(previa));
  }

  confirmar(): void {
    limparErrosDaApi(this.form);
    if (this.form.invalid || !this.previa()?.resultado) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.assinaturaService.trocarPlano(this.assinatura.idUsuario, this.toRequest()).subscribe({
      next: (resultado) => this.dialogRef.close(resultado),
      error: (error: HttpErrorResponse) => {
        this.enviando.set(false);
        aplicarErrosDaApi(this.form, error, 'Erro ao trocar o plano.');
        console.error('Erro ao trocar o plano:', error);
      },
    });
  }

  getErrorMessage(field: string): string | null {
    return mensagemDeErro(this.form.get(field), this.fieldMessages[field] ?? {});
  }

  private toRequest(): TrocaPlanoRequest {
    const valores = this.form.getRawValue();
    return {
      idPlano: valores.idPlano!,
      idPeriodicidade: valores.idPeriodicidade!,
      idCupom: valores.idCupom ?? null,
      idFormaPagamento: this.semCusto() ? FORMA_PAGAMENTO_NENHUMA : (valores.idFormaPagamento ?? null),
    };
  }

  private mensagemDaApi(error: HttpErrorResponse): string {
    const problem = error.error as ApiProblem | null;
    return problem?.errors?.[0]?.message ?? problem?.detail ?? 'Não foi possível calcular a troca.';
  }
}
