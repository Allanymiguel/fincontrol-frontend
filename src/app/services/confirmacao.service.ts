import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ConfirmacaoDialog, DadosConfirmacao } from '../components/confirmacao/confirmacao-dialog';

// Pergunta ao usuario antes de uma acao. Uso: if (!(await this.confirmacao.confirmar({...}))) return;
@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  private readonly dialog = inject(MatDialog);

  confirmar(dados: DadosConfirmacao): Promise<boolean> {
    const ref = this.dialog.open<ConfirmacaoDialog, DadosConfirmacao, boolean>(ConfirmacaoDialog, {
      data: dados,
      width: '440px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: 'dialog',
    });
    // fechar com Esc ou clicando fora conta como "nao"
    return firstValueFrom(ref.afterClosed()).then((ok) => ok === true);
  }
}
