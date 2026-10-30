import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ApiProblem } from '../../../models/api-problem.model';
import { Pagamento } from '../../../models/pagamento.model';
import { PagamentoService } from '../../../services/pagamento.service';

// Estorno de um pagamento aprovado: motivo obrigatorio. So o registro financeiro muda (a receita do
// mes do estorno diminui); plano e periodo da assinatura continuam. Fecha com o pagamento estornado.
@Component({
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule,
    MatIconModule, MatInputModule],
  selector: 'app-estorno-dialog',
  styleUrl: './estorno-dialog.css',
  template: `
    <h2 mat-dialog-title class="titulo">Estornar pagamento</h2>
    <mat-dialog-content>
      <dl class="dados">
        <div><dt>Usuário</dt><dd>{{ pagamento.nomeUsuario }} <span class="secundario">{{ pagamento.emailUsuario }}</span></dd></div>
        <div><dt>Data</dt><dd class="num">{{ pagamento.dataPagamento | date }}</dd></div>
        <div><dt>Plano</dt><dd>{{ pagamento.nomePlano }} ({{ pagamento.periodicidade.nome.toLowerCase() }})</dd></div>
        <div><dt>Valor</dt><dd class="num">R$ {{ pagamento.valor | number:'1.2-2' }} · {{ pagamento.formaPagamento.nome }}</dd></div>
      </dl>
      <p class="callout callout-neutro" role="note">
        <mat-icon aria-hidden="true">info</mat-icon>
        <span>
          Só o registro financeiro muda: a receita deste mês diminui R$ {{ pagamento.valor | number:'1.2-2' }}.
          O plano e o período da assinatura continuam (para mudar o plano, use “Trocar plano” no usuário).
        </span>
      </p>
      <mat-form-field appearance="outline" class="campo-motivo">
        <mat-label>Motivo</mat-label>
        <textarea matInput [formControl]="motivo" rows="3" maxlength="255" cdkFocusInitial
          placeholder="Ex.: cobrança em duplicidade no cartão"></textarea>
        <mat-hint align="end">{{ motivo.value.length }}/255</mat-hint>
        @if (motivo.hasError('required') || motivo.hasError('minlength')) {
          <mat-error>Informe o motivo (pelo menos 5 caracteres).</mat-error>
        }
      </mat-form-field>
      @if (erro(); as erro) {
        <p class="callout callout-erro" role="alert">
          <mat-icon aria-hidden="true">error</mat-icon>
          <span>{{ erro }}</span>
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton="outlined" type="button" mat-dialog-close>Voltar</button>
      <button matButton="filled" type="button" class="botao-perigo" (click)="estornar()" [disabled]="salvando()">
        <mat-icon>undo</mat-icon>
        {{ salvando() ? 'Estornando...' : 'Estornar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class EstornoDialog {
  readonly pagamento = inject<Pagamento>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<EstornoDialog, Pagamento>);
  private readonly pagamentoService = inject(PagamentoService);

  readonly motivo = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5), Validators.maxLength(255)],
  });
  readonly salvando = signal(false);
  readonly erro = signal<string | null>(null);

  estornar(): void {
    this.motivo.setValue(this.motivo.value.trim());
    if (this.motivo.invalid) {
      this.motivo.markAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    this.pagamentoService.estornar(this.pagamento.id, this.motivo.value).subscribe({
      next: (estornado) => this.ref.close(estornado),
      error: (error: HttpErrorResponse) => {
        this.salvando.set(false);
        const problem = error.error as ApiProblem | null;
        this.erro.set(problem?.errors?.[0]?.message ?? problem?.detail ?? 'Não foi possível estornar o pagamento.');
      },
    });
  }
}
