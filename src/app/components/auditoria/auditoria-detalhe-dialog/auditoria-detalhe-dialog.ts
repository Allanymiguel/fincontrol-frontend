import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { EventoAuditoria } from '../../../models/auditoria.model';

// Detalhe de um evento da auditoria: quem, quando, sobre o que e o "antes e depois" de cada campo
@Component({
  imports: [DatePipe, MatButtonModule, MatDialogModule, MatIconModule],
  selector: 'app-auditoria-detalhe-dialog',
  styleUrl: './auditoria-detalhe-dialog.css',
  templateUrl: './auditoria-detalhe-dialog.html',
})
export class AuditoriaDetalheDialog {
  readonly evento = inject<EventoAuditoria>(MAT_DIALOG_DATA);

  // criacao: nada antes; exclusao: nada depois
  readonly criacao = this.evento.alteracoes.length > 0 && this.evento.alteracoes.every((a) => !a.oculto && a.antes === null);
  readonly exclusao = this.evento.alteracoes.length > 0 && this.evento.alteracoes.every((a) => !a.oculto && a.depois === null);
}
