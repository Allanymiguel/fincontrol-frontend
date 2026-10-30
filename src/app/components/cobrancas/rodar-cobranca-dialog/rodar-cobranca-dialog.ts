import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

// Disparo manual da cobranca: "cobrar ate" uma data (padrao: hoje). Uma data futura simula a
// passagem do tempo, para demonstrar a cobranca, as trocas agendadas e a recusa. Fecha com a data.
@Component({
  imports: [FormsModule, MatButtonModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule,
    MatInputModule],
  selector: 'app-rodar-cobranca-dialog',
  styles: `
    .titulo { font-size: 1.25rem; font-weight: 800; }
    .mensagem { margin: 0 0 1rem; color: var(--color-text-secondary); line-height: 1.5; }
    .campo-data { width: 100%; }
    .callout { margin: 0.5rem 0 0; }
    mat-dialog-actions { gap: 0.5rem; }
  `,
  template: `
    <h2 mat-dialog-title class="titulo">Rodar a cobrança agora</h2>
    <mat-dialog-content>
      <p class="mensagem">
        As assinaturas com cobrança vencida até a data serão cobradas e as trocas agendadas, aplicadas.
        Rodar de novo não cobra duas vezes; só a cobrança recusada ganha nova tentativa.
        A execução fica no histórico e na auditoria.
      </p>
      <mat-form-field appearance="outline" class="campo-data">
        <mat-label>Cobrar até</mat-label>
        <input matInput [matDatepicker]="picker" [max]="maximo" [ngModel]="data()" (ngModelChange)="data.set($event)" required />
        <mat-datepicker-toggle matIconSuffix [for]="picker" />
        <mat-datepicker #picker />
        <mat-hint>Padrão: hoje</mat-hint>
      </mat-form-field>
      @if (futura()) {
        <p class="callout callout-alerta" role="note">
          <mat-icon aria-hidden="true">fast_forward</mat-icon>
          <span>Data futura: simula a passagem do tempo (para demonstração). Os pagamentos ficam com a data do vencimento.</span>
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton="outlined" type="button" mat-dialog-close>Voltar</button>
      <button matButton="filled" type="button" [disabled]="!data()" (click)="ref.close(data())">
        <mat-icon>play_circle</mat-icon>
        Rodar agora
      </button>
    </mat-dialog-actions>
  `,
})
export class RodarCobrancaDialog {
  readonly ref = inject(MatDialogRef<RodarCobrancaDialog, Date>);

  private readonly hoje = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  // ate um ano a frente: suficiente para mostrar ciclos mensais e anuais
  readonly maximo = new Date(this.hoje.getFullYear() + 1, this.hoje.getMonth(), this.hoje.getDate());
  readonly data = signal<Date | null>(this.hoje);
  readonly futura = computed(() => (this.data()?.getTime() ?? 0) > this.hoje.getTime());
}
