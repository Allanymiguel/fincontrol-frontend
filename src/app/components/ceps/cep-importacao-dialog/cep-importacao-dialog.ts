import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ImportacaoCep, formatarCep } from '../../../models/endereco-cliente.model';

// Resumo da importacao CSV: importados, atualizados e cada linha rejeitada com o motivo
@Component({
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  selector: 'app-cep-importacao-dialog',
  styleUrl: './cep-importacao-dialog.css',
  template: `
    <h2 mat-dialog-title class="titulo">Importação concluída</h2>
    <mat-dialog-content>
      <div class="totais">
        <div class="total"><span class="label-caps">Importados</span><strong>{{ resultado.importados }}</strong></div>
        <div class="total"><span class="label-caps">Atualizados</span><strong>{{ resultado.atualizados }}</strong></div>
        <div class="total" [class.com-rejeitados]="resultado.rejeitados.length > 0">
          <span class="label-caps">Rejeitados</span><strong>{{ resultado.rejeitados.length }}</strong>
        </div>
      </div>
      @if (resultado.rejeitados.length > 0) {
        <div class="table-scroll">
          <table class="rejeitados">
            <thead>
              <tr><th scope="col">Linha</th><th scope="col">CEP</th><th scope="col">Motivo</th></tr>
            </thead>
            <tbody>
              @for (rejeicao of resultado.rejeitados; track rejeicao.linha) {
                <tr>
                  <td class="num">{{ rejeicao.linha }}</td>
                  <td class="num">{{ rejeicao.cep ? formatarCep(rejeicao.cep) : '—' }}</td>
                  <td>{{ rejeicao.motivo }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      <p class="secundario nota">Importados entram como "Importação" e não verificados. CEP já verificado nunca é sobrescrito.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton="filled" type="button" mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
})
export class CepImportacaoDialog {
  readonly resultado = inject<ImportacaoCep>(MAT_DIALOG_DATA);
  readonly formatarCep = formatarCep;
}
