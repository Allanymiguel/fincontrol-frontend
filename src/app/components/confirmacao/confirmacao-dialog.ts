import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface DadosConfirmacao {
  titulo: string;
  mensagem: string;
  // rotulo do botao que confirma (ex.: "Excluir")
  confirmar: string;
  // acao destrutiva: icone e botao em vermelho
  perigo?: boolean;
  icone?: string;
}

// Janela de confirmacao no lugar do confirm() do navegador. Fecha com true (confirmou) ou false/undefined.
@Component({
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  selector: 'app-confirmacao-dialog',
  styleUrl: './confirmacao-dialog.css',
  templateUrl: './confirmacao-dialog.html',
})
export class ConfirmacaoDialog {
  readonly dados = inject<DadosConfirmacao>(MAT_DIALOG_DATA);
}
