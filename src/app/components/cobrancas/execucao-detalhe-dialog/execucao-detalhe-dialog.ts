import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ExecucaoCobranca, STATUS_FALHA, STATUS_SUCESSO } from '../../../models/cobranca.model';

// Detalhe de uma execucao da cobranca: totais, quem disparou e o que falhou
@Component({
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatDialogModule, MatIconModule],
  selector: 'app-execucao-detalhe-dialog',
  styleUrl: './execucao-detalhe-dialog.css',
  template: `
    <h2 mat-dialog-title class="titulo">Cobrança até {{ execucao.dataReferencia | date }}</h2>
    <mat-dialog-content>
      <div class="cabecalho">
        <span [class]="'tag ' + tom()">{{ execucao.status.nome }}</span>
        <span class="tag">{{ execucao.origem.nome }}</span>
        <span class="secundario">{{ execucao.disparadoPor }}</span>
      </div>
      <dl class="totais">
        <div><dt>Início</dt><dd class="num">{{ execucao.inicio | date:'dd/MM/yyyy HH:mm:ss' }}</dd></div>
        <div><dt>Duração</dt><dd class="num">{{ execucao.duracaoMs / 1000 | number:'1.1-2' }} s</dd></div>
        <div><dt>Assinaturas</dt><dd class="num">{{ execucao.assinaturasProcessadas }}</dd></div>
        <div><dt>Pagamentos</dt><dd class="num">{{ execucao.pagamentosGerados }}</dd></div>
        <div><dt>Recusados</dt><dd class="num">{{ execucao.pagamentosRecusados }}</dd></div>
        <div><dt>Valor</dt><dd class="num">R$ {{ execucao.valorTotal | number:'1.2-2' }}</dd></div>
        <div><dt>Trocas aplicadas</dt><dd class="num">{{ execucao.trocasAplicadas }}</dd></div>
        <div><dt>Voltas ao Gratuito</dt><dd class="num">{{ execucao.voltasAoGratuito }}</dd></div>
      </dl>
      @if (execucao.mensagemErro) {
        <p class="callout callout-erro" role="alert">
          <mat-icon aria-hidden="true">error</mat-icon>
          <span>A execução falhou: {{ execucao.mensagemErro }}</span>
        </p>
      }
      @if (execucao.erros.length > 0) {
        <h3 class="label-caps">Assinaturas que falharam (as outras seguiram)</h3>
        <div class="table-scroll">
          <table class="erros">
            <thead><tr><th scope="col">Assinatura</th><th scope="col">Usuário</th><th scope="col">Erro</th></tr></thead>
            <tbody>
              @for (erro of execucao.erros; track erro.idAssinatura) {
                <tr><td class="num">#{{ erro.idAssinatura }}</td><td>{{ erro.usuario ?? '—' }}</td><td>{{ erro.mensagem }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (!execucao.mensagemErro) {
        <p class="secundario">Nenhum erro nesta execução.</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton="filled" type="button" mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
})
export class ExecucaoDetalheDialog {
  readonly execucao = inject<ExecucaoCobranca>(MAT_DIALOG_DATA);

  tom(): string {
    return this.execucao.status.id === STATUS_SUCESSO ? 'tag-ok' : this.execucao.status.id === STATUS_FALHA ? 'tag-erro' : 'tag-alerta';
  }
}
